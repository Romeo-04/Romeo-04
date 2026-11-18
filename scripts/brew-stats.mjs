// Brews the live stats cards from the GitHub GraphQL API.
//   GITHUB_TOKEN=... GH_USER=Romeo-04 node scripts/brew-stats.mjs [outDir]
import { mkdir, writeFile } from "node:fs/promises";
import { C, esc, svg, textWidth } from "./lib.mjs";

const USER = process.env.GH_USER || "Romeo-04";
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = process.argv[2] || "dist";
if (!TOKEN) throw new Error("GITHUB_TOKEN is required");

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "cafe-readme" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const { user } = await gql(
  `query($login:String!){ user(login:$login){
    createdAt
    followers{ totalCount }
    pullRequests{ totalCount }
    issues{ totalCount }
    contributionsCollection{
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions totalRepositoriesWithContributedCommits
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  } }`,
  { login: USER }
);

// Owned, non-fork public repos (paginated) for stars + language bytes.
let repos = [], cursor = null;
do {
  const d = await gql(
    `query($login:String!,$after:String){ user(login:$login){ repositories(first:100, after:$after, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC){
      totalCount pageInfo{ hasNextPage endCursor }
      nodes{ stargazerCount languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } }
    } } }`,
    { login: USER, after: cursor }
  );
  const r = d.user.repositories;
  repos.push(...r.nodes);
  cursor = r.pageInfo.hasNextPage ? r.pageInfo.endCursor : null;
} while (cursor);

// ---------- numbers ----------
const cc = user.contributionsCollection;
const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount ? run + 1 : 0; longest = Math.max(longest, run); }
// current streak: today may still be empty, so start from yesterday in that case
let current = 0;
let i = days.length - 1;
if (days[i]?.contributionCount === 0) i--;
for (; i >= 0 && days[i].contributionCount > 0; i--) current++;
const stars = repos.reduce((a, r) => a + r.stargazerCount, 0);
const busiest = days.reduce((a, d) => (d.contributionCount > a.contributionCount ? d : a), days[0]);
const weeks = cc.contributionCalendar.weeks.slice(-16).map((w) => w.contributionDays.reduce((a, d) => a + d.contributionCount, 0));

// Blend score = sqrt(bytes) * sqrt(repo count), so one giant repo can't drown out the rest.
const bytes = {}, count = {};
for (const r of repos)
  for (const e of r.languages.edges) {
    bytes[e.node.name] = (bytes[e.node.name] || 0) + e.size;
    count[e.node.name] = (count[e.node.name] || 0) + 1;
  }
const langs = Object.fromEntries(Object.keys(bytes).map((n) => [n, Math.sqrt(bytes[n]) * Math.sqrt(count[n])]));
const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
const sorted = Object.entries(langs).sort((a, b) => b[1] - a[1]);
const top = sorted.slice(0, 6).map(([n, b]) => [n, b / totalBytes]);
const other = 1 - top.reduce((a, [, p]) => a + p, 0);
if (other > 0.005) top.push(["Other", other]);

const fmt = (n) => n.toLocaleString("en-US");
const now = new Date();
const stamp = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Manila" }).toUpperCase();
const fmtDay = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).toUpperCase();

const t = (x, y, s, { f = "courier", size = 18, fill = C.ink, anchor = "start", ls = 0, weight } = {}) =>
  `<text x="${x}" y="${y}" class="f-${f}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ""}${weight ? ` font-weight="${weight}"` : ""}>${esc(s)}</text>`;

const W = 590, H = 640, pad = 40;

// =====================================================================
// TODAY'S TAB — receipt of the year
// =====================================================================
async function tab() {
  const dash = (y) => `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="${C.inkMuted}" stroke-width="1.4" stroke-dasharray="5 5"/>`;
  const row = (y, a, b, o = {}) => t(pad, y, a, o) + t(W - pad, y, b, { anchor: "end", ...o });
  const items = [
    ["Commits", cc.totalCommitContributions],
    ["Pull requests", cc.totalPullRequestContributions],
    ["Issues opened", cc.totalIssueContributions],
    ["Code reviews", cc.totalPullRequestReviewContributions],
    ["Repos contributed to", cc.totalRepositoriesWithContributedCommits],
  ];
  const max = Math.max(...weeks, 1);
  const bw = (W - pad * 2) / weeks.length;
  const bars = weeks
    .map((v, k) => {
      const h = Math.max(3, (v / max) * 58);
      return `<rect class="bar" style="animation-delay:${k * 0.05}s" x="${pad + k * bw + 2}" y="${542 - h}" width="${bw - 4}" height="${h}" rx="2" fill="${k === weeks.length - 1 ? C.accent : C.inkSoft}"/>`;
    })
    .join("");
  const paper = (() => {
    let p = `M0 12`;
    for (let x = 0; x < W; x += 16) p += ` L${x + 8} 2 L${x + 16} 12`;
    p += ` L${W} ${H - 12}`;
    for (let x = W; x > 0; x -= 16) p += ` L${x - 8} ${H - 2} L${x - 16} ${H - 12}`;
    return p + " Z";
  })();
  const body = `
<path d="${paper}" fill="#fffdf8" stroke="${C.lineStrong}" stroke-width="1.5"/>
${t(W / 2, 68, "TODAY'S TAB", { f: "lilita", size: 42, anchor: "middle", ls: 3 })}
${t(W / 2, 98, `@${USER.toUpperCase()} · BREWED ${stamp}`, { size: 15, fill: C.inkMuted, anchor: "middle", ls: 1 })}
${dash(118)}
${row(150, "QTY  ITEM (PAST 12 MONTHS)", "", { size: 15, fill: C.label, weight: 700 })}
${items.map(([k, v], n) => row(184 + n * 31, `${String(n + 1).padStart(2, "0")}   ${k}`, fmt(v))).join("")}
${dash(324)}
${row(358, "Current streak", `${current} day${current === 1 ? "" : "s"}`)}
${row(389, "Longest streak", `${longest} days`)}
${row(420, "Busiest day", `${fmtDay(busiest.date)} · ${busiest.contributionCount}`)}
${dash(442)}
${t(pad, 470, "LAST 16 WEEKS", { size: 14, fill: C.label, weight: 700, ls: 1 })}
${bars}
${dash(562)}
${row(592, "TOTAL", `${fmt(cc.contributionCalendar.totalContributions)} contribs`, { size: 22, weight: 700 })}
${t(W / 2, 620, `★ ${fmt(stars)} stars · ${fmt(user.followers.totalCount)} regulars · ${fmt(repos.length)} repos`, { size: 15, fill: C.inkMuted, anchor: "middle" })}`;
  const css = `.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .7s ease-out both}@keyframes grow{from{transform:scaleY(0)}}`;
  return svg({ w: W, h: H, body, css, title: `${USER}'s contributions: ${cc.contributionCalendar.totalContributions} in the past year` });
}

// =====================================================================
// HOUSE ROAST — language blend
// =====================================================================
async function blend() {
  const roast = ["#2b1a10", "#5a3420", "#8b5a2c", "#c4552f", "#e08a5f", "#e9b98f", "#cdbba5"];
  const barW = W - pad * 2;
  let x = pad;
  const segs = top
    .map(([n, p], k) => {
      const w = Math.max(p * barW, 3);
      const r = `<rect x="${x}" y="156" width="${w}" height="36" fill="${roast[k]}"/>`;
      x += w;
      return r;
    })
    .join("");
  const list = top
    .map(([n, p], k) => {
      const y = 252 + k * 46;
      const pct = `${(p * 100).toFixed(1)}%`;
      const lw = textWidth(n, 20, 0.58);
      return `<circle cx="${pad + 10}" cy="${y - 6}" r="10" fill="${roast[k]}"/>` +
        t(pad + 32, y, n, { f: "varela", size: 20 }) +
        `<line x1="${pad + 46 + lw}" y1="${y - 5}" x2="${W - pad - 82}" y2="${y - 5}" stroke="${C.inkMuted}" stroke-dasharray="1 6" stroke-width="1.6" stroke-linecap="round"/>` +
        t(W - pad, y, pct, { size: 19, weight: 700, anchor: "end" });
    })
    .join("");
  const body = `
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.screen}" stroke="${C.lineStrong}" stroke-width="2"/>
${t(pad, 62, "HOUSE ROAST · BYTES × REPOS", { f: "varela", size: 15, fill: C.label, ls: 2.4 })}
${t(pad, 112, "The Blend", { f: "lilita", size: 48 })}
${t(W - pad, 106, `${repos.length} repos ground`, { f: "kalam", size: 26, fill: C.accent, anchor: "end" })}
<clipPath id="pill"><rect x="${pad}" y="156" width="${barW}" height="36" rx="18"/></clipPath>
<g clip-path="url(#pill)">${segs}</g>
<rect x="${pad}" y="156" width="${barW}" height="36" rx="18" fill="none" stroke="${C.lineStrong}"/>
${list}
<line x1="${pad}" y1="${H - 52}" x2="${W - pad}" y2="${H - 52}" stroke="${C.line}" stroke-width="2"/>
${t(pad, H - 24, "roasted fresh daily from the GitHub API", { f: "kalam", size: 22, fill: C.inkMuted })}`;
  return svg({ w: W, h: H, body, title: `Language blend: ${top.map(([n, p]) => `${n} ${(p * 100).toFixed(1)}%`).join(", ")}` });
}

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/todays-tab.svg`, await tab());
await writeFile(`${OUT}/house-blend.svg`, await blend());
console.log(`brewed: ${cc.contributionCalendar.totalContributions} contributions, streak ${current}/${longest}, ${stars} stars, ${repos.length} repos`);
console.log(top.map(([n, p]) => `${n} ${(p * 100).toFixed(1)}%`).join(" | "));
