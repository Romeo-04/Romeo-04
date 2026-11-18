// Builds the static café-themed SVGs in /assets.  Run: node scripts/build-static.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { C, esc, wrap, textWidth, svg } from "./lib.mjs";

const OUT = new URL("../assets/", import.meta.url);
await mkdir(OUT, { recursive: true });
const save = async (name, s) => {
  await writeFile(new URL(name, OUT), s);
  console.log(`assets/${name}  ${(s.length / 1024).toFixed(1)} KB`);
};

// ---------- tiny drawing helpers ----------
const t = (x, y, s, { f = "varela", size = 16, fill = C.ink, anchor = "start", ls = 0, weight, extra = "" } = {}) =>
  `<text x="${x}" y="${y}" class="f-${f}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${
    ls ? ` letter-spacing="${ls}"` : ""
  }${weight ? ` font-weight="${weight}"` : ""} ${extra}>${esc(s)}</text>`;

const cup = (x, y, s = 1, color = C.accent, steam = false) => `
<g transform="translate(${x} ${y}) scale(${s})">
  ${
    steam
      ? `<g class="steam" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" opacity=".7">
      <path class="s1" d="M-7 -20 q-5 -6 0 -12 q5 -6 0 -12"/>
      <path class="s2" d="M3 -20 q-5 -6 0 -12 q5 -6 0 -12"/></g>`
      : ""
  }
  <path d="M-16 -14 h30 v14 a15 15 0 0 1 -15 15 a15 15 0 0 1 -15 -15 z" fill="${color}"/>
  <path d="M14 -9 a7 7 0 0 1 0 14" fill="none" stroke="${color}" stroke-width="3.4"/>
  <rect x="-20" y="17" width="38" height="4" rx="2" fill="${color}"/>
</g>`;

const STEAM_CSS = `
.steam path{animation:rise 3.2s ease-in-out infinite;transform-box:fill-box}
.steam .s2{animation-delay:1.6s}
@keyframes rise{0%{opacity:0;transform:translateY(6px)}35%{opacity:.85}100%{opacity:0;transform:translateY(-10px)}}`;

// =====================================================================
// 1. HEADER — the storefront
// =====================================================================
async function header() {
  const W = 1200, H = 500;
  const tagline = wrap("Building thoughtful systems across full-stack web, on-device machine learning, and agent-driven development.", 360, 17, 0.5);

  const person = (x, shirt, skin, hair, cupSide = 1, delay = 0) => `
  <g class="bob" style="animation-delay:${delay}s">
    <rect x="${x - 11}" y="398" width="9" height="40" rx="4" fill="#1f2a4d"/>
    <rect x="${x + 2}" y="398" width="9" height="40" rx="4" fill="#1f2a4d"/>
    <rect x="${x - 16}" y="352" width="32" height="52" rx="13" fill="${shirt}"/>
    <rect x="${x + cupSide * 14 - 4}" y="362" width="8" height="28" rx="4" fill="${shirt}" transform="rotate(${-cupSide * 20} ${x + cupSide * 14} 364)"/>
    <rect x="${x + cupSide * 22 - 5}" y="382" width="10" height="12" rx="2" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>
    <circle cx="${x}" cy="336" r="15" fill="${skin}"/>
    <path d="M${x - 15} 334 a15 15 0 0 1 30 0 q-6 -6 -15 -5 q-9 -1 -15 5z" fill="${hair}"/>
    <circle cx="${x - 5}" cy="338" r="1.7" fill="${C.ink}"/><circle cx="${x + 5}" cy="338" r="1.7" fill="${C.ink}"/>
  </g>`;

  const bubble = (x, y, d) => `
  <g class="bubble" style="animation-delay:${d}s">
    <rect x="${x}" y="${y}" width="46" height="30" rx="9" fill="${C.screen}" stroke="${C.ink}" stroke-width="2"/>
    <path d="M${x + 18} ${y + 30} l5 8 l5 -8" fill="${C.screen}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="${x + 17}" y="${y + 28}" width="13" height="4" fill="${C.screen}"/>
    <path d="M${x + 12} ${y + 10} l-2 9 M${x + 18} ${y + 10} l-2 9 M${x + 28} ${y + 10} l-2 9 M${x + 34} ${y + 10} l-2 9" stroke="${C.accent}" stroke-width="4" stroke-linecap="round"/>
  </g>`;

  const bush = (x, y, r) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#5f9a3e"/><circle cx="${x + r * 0.8}" cy="${y - 3}" r="${r * 0.85}" fill="#76b04f"/>` +
    `<circle cx="${x + 3}" cy="${y - r * 0.4}" r="2.6" fill="#ffffff"/><circle cx="${x + r}" cy="${y - r * 0.2}" r="2.6" fill="#e8622c"/>`;

  const books = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 9 }, (_, i) => {
      const cols = ["#c4552f", "#2f6c8f", "#e3b25a", "#5f9a3e", "#8b5a2c", "#d9826a"];
      const h = 16 + ((i * 7 + row * 3) % 6);
      return `<rect x="${985 + i * 10}" y="${338 + row * 26 - h}" width="8" height="${h}" fill="${cols[(i + row * 2) % cols.length]}"/>`;
    }).join("") + `<rect x="980" y="${338 + row * 26}" width="100" height="3" fill="#8b5a2c"/>`
  ).join("");

  const lamps = [560, 700, 900]
    .map(
      (x, i) => `<line x1="${x}" y1="306" x2="${x}" y2="322" stroke="${C.night}" stroke-width="2"/>
    <circle class="glow" style="animation-delay:${i * 0.7}s" cx="${x}" cy="330" r="16" fill="#ffd98a" opacity=".45"/>
    <path d="M${x - 9} 330 l4 -9 h10 l4 9z" fill="${C.night}"/><circle cx="${x}" cy="331" r="3" fill="#ffe7b0"/>`
    )
    .join("");

  const body = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb9e6"/><stop offset="1" stop-color="#d4ebf8"/></linearGradient>
  <linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe8cc"/><stop offset="1" stop-color="#efcfa6"/></linearGradient>
  <pattern id="thatch" width="7" height="12" patternUnits="userSpaceOnUse"><rect width="7" height="12" fill="#8f5d2d"/><rect width="2" height="12" fill="#7a4c22"/><rect x="4" y="3" width="1" height="7" fill="#a46b35"/></pattern>
  <pattern id="brick" width="26" height="14" patternUnits="userSpaceOnUse"><rect width="26" height="14" fill="#c46d4c"/><path d="M0 13.5h26M13 0v7M0 7h26M0 7v7M26 7v7" stroke="#a9563a" stroke-width="1.4"/></pattern>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="28"/></clipPath>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2b1a10" flood-opacity=".25"/></filter>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g class="clouds" fill="#fff">
    <g opacity=".95"><ellipse cx="760" cy="120" rx="58" ry="26"/><ellipse cx="800" cy="102" rx="40" ry="30"/><ellipse cx="840" cy="122" rx="46" ry="22"/></g>
    <g opacity=".85"><ellipse cx="1040" cy="64" rx="44" ry="18"/><ellipse cx="1070" cy="52" rx="30" ry="22"/></g>
    <g opacity=".7"><ellipse cx="560" cy="70" rx="36" ry="14"/><ellipse cx="584" cy="60" rx="24" ry="16"/></g>
  </g>
  <!-- neighbours -->
  <path d="M440 120 l60 -40 v360 h-60z" fill="#e8987a"/><rect x="452" y="160" width="26" height="40" rx="3" fill="#bfe0f0"/><rect x="452" y="230" width="26" height="40" rx="3" fill="#bfe0f0"/>
  <path d="M1110 140 l60 -50 h40 v350 h-100z" fill="#a8cde4"/><rect x="1130" y="180" width="30" height="44" rx="3" fill="#e9f5fb"/><rect x="1130" y="250" width="30" height="44" rx="3" fill="#e9f5fb"/>
  <!-- roof -->
  <rect x="488" y="150" width="616" height="110" fill="url(#thatch)"/>
  <rect x="488" y="150" width="616" height="6" fill="#6e441d"/>
  <!-- sign -->
  <rect x="468" y="254" width="656" height="48" rx="4" fill="${C.night}"/>
  ${t(796, 289, "JHEZRA'S CAFÉ", { f: "lilita", size: 30, fill: C.screen, anchor: "middle", ls: 4 })}
  <!-- storefront -->
  <rect x="494" y="302" width="604" height="134" fill="${C.night}"/>
  <rect x="502" y="308" width="588" height="122" fill="url(#room)"/>
  <rect x="502" y="308" width="130" height="122" fill="url(#brick)"/>
  <rect x="760" y="322" width="108" height="56" rx="4" fill="#2f3b33" stroke="#8b5a2c" stroke-width="4"/>
  ${t(814, 344, "MENU", { f: "kalam", size: 15, fill: "#f3ead8", anchor: "middle", weight: 700 })}
  <path d="M776 354 h40 M776 364 h60 M824 354 h28" stroke="#f3ead8" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  ${books}
  <rect x="880" y="384" width="96" height="30" rx="3" fill="#b9774a"/><rect x="876" y="380" width="104" height="6" rx="2" fill="#8b5a2c"/>
  ${lamps}
  <g fill="${C.night}"><rect x="630" y="308" width="6" height="122"/><rect x="740" y="308" width="6" height="122"/><rect x="960" y="308" width="6" height="122"/></g>
  <!-- planters -->
  <rect x="502" y="410" width="250" height="22" fill="${C.night}"/><rect x="968" y="410" width="122" height="22" fill="${C.night}"/>
  ${bush(516, 410, 13)}${bush(552, 408, 14)}${bush(590, 410, 12)}${bush(628, 408, 14)}${bush(668, 410, 13)}${bush(708, 408, 13)}
  ${bush(984, 410, 13)}${bush(1022, 408, 14)}${bush(1060, 410, 12)}
  ${bubble(586, 296, 0)}${bubble(700, 292, 0.8)}${bubble(1020, 298, 1.6)}
  <!-- street -->
  <rect x="0" y="436" width="${W}" height="20" fill="#ece0cf"/><rect x="0" y="456" width="${W}" height="4" fill="#d8c8b2"/>
  <rect x="0" y="460" width="${W}" height="40" fill="#9a9a9e"/>
  <g fill="#f2df8a"><rect x="560" y="478" width="150" height="5" rx="2"/><rect x="860" y="478" width="150" height="5" rx="2"/></g>
  ${person(612, "#6d9ac4", "#f1c7a0", "#2b1a10", 1, 0)}
  ${person(712, "#8cb85c", "#e7b48a", "#5a3420", 1, 0.6)}
  ${person(1038, "#e8622c", "#c98a5e", "#2b1a10", -1, 1.2)}
  <!-- pup -->
  <g class="wag"><ellipse cx="800" cy="424" rx="17" ry="10" fill="#e3b25a"/><circle cx="816" cy="412" r="9" fill="#e3b25a"/><path d="M812 404 l-4 -6 l7 3z" fill="#b9853a"/>
  <rect x="788" y="428" width="5" height="10" fill="#e3b25a"/><rect x="806" y="428" width="5" height="10" fill="#e3b25a"/><circle cx="819" cy="411" r="1.5" fill="${C.ink}"/>
  <path class="tail" d="M783 420 q-10 -6 -8 -16" stroke="#e3b25a" stroke-width="4" fill="none" stroke-linecap="round"/></g>
  <!-- hanging blade sign -->
  <path d="M1104 262 h50" stroke="${C.night}" stroke-width="5"/><path d="M1124 262 v14 M1146 262 v14" stroke="${C.night}" stroke-width="2"/>
  <g class="swing"><circle cx="1135" cy="306" r="31" fill="${C.screen}" stroke="${C.accent}" stroke-width="5"/>${cup(1133, 314, 0.95, C.accent, true)}</g>

  <!-- phone card -->
  <g filter="url(#shadow)">
    <rect x="30" y="22" width="420" height="458" rx="44" fill="${C.night}"/>
    <rect x="40" y="32" width="400" height="438" rx="36" fill="${C.screen}"/>
  </g>
  <rect x="200" y="44" width="82" height="22" rx="11" fill="${C.night}"/>
  ${t(72, 60, "9:41", { size: 14, fill: C.ink, weight: 700 })}
  <g fill="${C.ink}"><rect x="384" y="54" width="3" height="6"/><rect x="389" y="51" width="3" height="9"/><rect x="394" y="48" width="3" height="12"/><rect x="401" y="50" width="16" height="9" rx="2.5"/></g>
  ${t(66, 104, "01 / 08 · STOREFRONT", { size: 13, fill: C.label, ls: 2.4 })}
  <line x1="66" y1="118" x2="414" y2="118" stroke="${C.lineStrong}"/>
  ${t(66, 148, "Software & AI Engineer · FEU Tech", { size: 15, fill: C.inkMuted })}
  ${t(66, 188, "Jhezra A. Tolentino", { f: "lilita", size: 36, fill: C.ink })}
  ${tagline.map((l, i) => t(66, 220 + i * 25, l, { size: 17, fill: C.inkSoft })).join("")}
  ${[
    ["BUILDING", "A fintech platform & an agent platform at Ed3N"],
    ["EXPLORING", "On-device retrieval & agent harness engineering"],
    ["LOOKING FOR", "SWE internships & research opportunities"],
  ]
    .map(([k, v], i) => t(66, 312 + i * 50, k, { size: 12, fill: C.label, ls: 2 }) + t(66, 332 + i * 50, v, { size: 14.5, fill: C.ink }))
    .join("")}
  <rect x="190" y="454" width="100" height="5" rx="2.5" fill="${C.ink}"/>
</g>`;

  const css = `${STEAM_CSS}
.clouds{animation:drift 18s ease-in-out infinite alternate}
@keyframes drift{to{transform:translateX(-40px)}}
.bob{animation:bob 2.6s ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-2px)}}
.bubble{animation:pop 4.8s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes pop{0%,10%{transform:scale(0);opacity:0}18%,70%{transform:scale(1);opacity:1}80%,100%{transform:scale(0);opacity:0}}
.glow{animation:glow 3s ease-in-out infinite}
@keyframes glow{50%{opacity:.2}}
.tail{animation:wag .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:100% 100%}
@keyframes wag{to{transform:rotate(-24deg)}}
.swing{animation:swing 4s ease-in-out infinite;transform-origin:1135px 262px}
@keyframes swing{50%{transform:rotate(3deg)}}`;

  await save("header.svg", await svg({ w: W, h: H, body, css, title: "Jhezra's Café — Jhezra A. Tolentino, Software & AI Engineer" }));
}

// =====================================================================
// 2. SECTION SIGNS
// =====================================================================
const SECTIONS = [
  ["about", "02", "ABOUT THE BARISTA", "About the Barista", "the person behind the counter"],
  ["ingredients", "03", "INGREDIENTS", "The Ingredients", "what goes in every cup"],
  ["menu", "04", "SIGNATURE DRINKS", "Signature Drinks", "house favourites, built fresh"],
  ["shelf", "05", "THE SHELF", "Off the Shelf", "more to take home"],
  ["roast", "06", "ROAST LOG", "The Roast Log", "where the beans were roasted"],
  ["wall", "07", "ON THE WALL", "On the Wall", "framed & hung with pride"],
  ["grind", "08", "THE DAILY GRIND", "The Daily Grind", "live from the espresso machine"],
];

async function sectionSign([id, num, eyebrow, title, note]) {
  const W = 1200, H = 112;
  const body = `
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="24" fill="${C.screen}" stroke="${C.lineStrong}" stroke-width="2"/>
<circle cx="66" cy="56" r="34" fill="${C.accent}"/>
${t(66, 70, num, { f: "lilita", size: 34, fill: C.screen, anchor: "middle" })}
${t(122, 40, `${eyebrow} · IN THE CAFÉ`, { size: 13, fill: C.label, ls: 2.6 })}
${t(120, 86, title, { f: "lilita", size: 44, fill: C.ink })}
<g transform="rotate(-3 ${W - 100} 64)">${t(W - 96, 76, note, { f: "kalam", size: 26, fill: C.accent, anchor: "end" })}</g>
${cup(W - 56, 66, 0.85, C.accent, true)}`;
  await save(`section-${id}.svg`, await svg({ w: W, h: H, body, css: STEAM_CSS, title }));
}

// =====================================================================
// 3. LOYALTY CARD (about)
// =====================================================================
async function loyalty() {
  const W = 1200, H = 260;
  const stamps = [
    ["3.8", "GPA"],
    ["DOST", "SEI SCHOLAR"],
    ["ELITE", "SCHOLAR"],
    ["GOLD", "DEAN'S LIST"],
    ["CS '27", "FEU TECH"],
    ["ACM", "WEB LEAD"],
    ["ED3N", "SWE INTERN"],
  ];
  const body = `
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="26" fill="${C.screen}" stroke="${C.lineStrong}" stroke-width="2"/>
<rect x="1" y="1" width="${W - 2}" height="58" rx="26" fill="${C.tint}"/><rect x="1" y="40" width="${W - 2}" height="19" fill="${C.tint}"/>
<line x1="1" y1="59" x2="${W - 1}" y2="59" stroke="${C.lineStrong}" stroke-dasharray="6 6"/>
${t(36, 38, "LOYALTY CARD", { size: 14, fill: C.label, ls: 3 })}
${t(198, 38, "7 / 7", { size: 14, fill: C.ink, weight: 700, ls: 1 })}
${t(W - 36, 38, "collect all seven: the barista's credentials", { f: "kalam", size: 20, fill: C.inkMuted, anchor: "end" })}
${stamps
  .map(([big, small], i) => {
    const cx = 105 + i * 165, cy = 158, r = 62, rot = [-8, 5, -4, 7, -6, 4, -9][i];
    return `<g class="stamp" style="animation-delay:${0.25 + i * 0.22}s;transform-origin:${cx}px ${cy}px">
    <g transform="rotate(${rot} ${cx} ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${i % 2 ? C.screen : "#fbeee4"}" stroke="${C.accent}" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 9}" fill="none" stroke="${C.accent}" stroke-width="1.6" stroke-dasharray="3 4"/>
      ${t(cx, cy + 6, big, { f: "lilita", size: big.length > 4 ? 26 : 32, fill: C.accent, anchor: "middle" })}
      ${t(cx, cy + 28, small, { f: "courier", size: 11.5, fill: C.label, anchor: "middle", weight: 700, ls: 1 })}
      <path d="M${cx - 16} ${cy - 30} h32" stroke="${C.accent}" stroke-width="2" stroke-linecap="round"/>
    </g></g>`;
  })
  .join("")}`;
  const css = `.stamp{animation:stamp .5s cubic-bezier(.2,1.4,.4,1) both}
@keyframes stamp{0%{opacity:0;transform:scale(1.6)}100%{opacity:1;transform:scale(1)}}`;
  await save("loyalty-card.svg", await svg({ w: W, h: H, body, css, title: "Loyalty card: 3.8 GPA, DOST-SEI Scholar, University Elite Scholar, Gold Dean's List, FEU Tech CS 2027, ACM Web Lead, Ed3N SWE Intern" }));
}

// =====================================================================
// 4. CHALKBOARD (ingredients)
// =====================================================================
async function chalkboard() {
  const W = 1200, H = 470;
  const cols = [
    ["House Blend", "the daily drivers", "●●●", ["Python", "TypeScript", "JavaScript", "SQL", "Next.js", "React", "Tailwind CSS", "PostgreSQL", "Git"]],
    ["Seasonal", "on rotation", "●●○", ["C++", "Dart", "Flutter", "FastAPI", "PyTorch", "ONNX"]],
    ["Experimental", "the barista's lab", "●○○", ["Agentic development", "Prompt & harness eng.", "LoRA fine-tuning", "SigLIP-2", "ANN indexing"]],
  ];
  const chalk = "#f3ead8";
  const body = `
<defs><filter id="chalk"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter></defs>
<rect x="0" y="0" width="${W}" height="${H}" rx="26" fill="#8b5a2c"/>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="22" fill="#a46b35" opacity=".5"/>
<rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="14" fill="#262b26"/>
<g opacity=".03" fill="${chalk}"><ellipse cx="300" cy="140" rx="220" ry="50"/><ellipse cx="900" cy="360" rx="260" ry="60"/></g>
<g filter="url(#chalk)">
  ${t(W / 2, 78, "Today's Blend", { f: "kalam", size: 42, fill: chalk, anchor: "middle", weight: 700 })}
  <path d="M480 94 q120 10 240 -2" stroke="${C.accent}" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${t(W - 54, 64, "strength ●●● bold  ●○○ light", { f: "courier", size: 13, fill: "#bdb3a2", anchor: "end" })}
  ${cols
    .map(([name, sub, dots, items], c) => {
      const x = 64 + c * 370;
      return (
        t(x, 148, name, { f: "kalam", size: 30, fill: "#f0a27f", weight: 700 }) +
        t(x, 172, sub, { size: 14, fill: "#bdb3a2" }) +
        items
          .map((it, i) => {
            const y = 210 + i * 26.5;
            const lw = textWidth(it, 18, 0.5);
            return (
              t(x, y, it, { size: 18, fill: chalk }) +
              `<line x1="${x + lw + 10}" y1="${y - 4}" x2="${x + 270}" y2="${y - 4}" stroke="${chalk}" stroke-width="1.6" stroke-dasharray="1 6" opacity=".55"/>` +
              t(x + 316, y, dots, { f: "courier", size: 15, fill: "#f0a27f", anchor: "end" })
            );
          })
          .join("")
      );
    })
    .join("")}
  <line x1="${64 + 370 - 30}" y1="132" x2="${64 + 370 - 30}" y2="420" stroke="${chalk}" stroke-width="1.4" stroke-dasharray="2 8" opacity=".3"/>
  <line x1="${64 + 740 - 30}" y1="132" x2="${64 + 740 - 30}" y2="420" stroke="${chalk}" stroke-width="1.4" stroke-dasharray="2 8" opacity=".3"/>
</g>
${cup(1110, 418, 0.9, "#f0a27f", true)}
${cup(1062, 418, 0.75, chalk, true)}`;
  await save("ingredients.svg", await svg({ w: W, h: H, body, css: STEAM_CSS, title: "Tech stack chalkboard: House Blend, Seasonal and Experimental ingredients" }));
}

// =====================================================================
// 5. SIGNATURE DRINK CARDS
// =====================================================================
const DRINKS = [
  {
    id: "homestead", name: "Homestead", tag: "GAME", role: "PILOT & COMMS · TEAM OF 6",
    desc: "A co-op survival game built for the NASA Space Apps Challenge 2026, with peer-to-peer multiplayer running right in the browser.",
    stack: ["TypeScript", "HTML5 Canvas", "Vite", "PeerJS", "Web Audio API"], cta: "Open code",
  },
  {
    id: "cs-expo", name: "CS Expo 2026", tag: "EVENT", role: "BACKEND DEV · RELEASE MAINTAINER",
    desc: "The event platform for FEU Tech's Computer Science capstone showcase: schedules, projects and everything in between.",
    stack: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Zod"], cta: "Live demo",
  },
  {
    id: "kitako", name: "KitaKo", tag: "RESEARCH", role: "PRODUCT MANAGER · STOCHASTIC 4",
    desc: "Undergraduate thesis: on-device Android image search that understands Taglish queries, powered by a fine-tuned SigLIP-2.",
    stack: ["PyTorch", "Flutter", "ONNX", "C++", "SigLIP-2", "LoRA"], cta: "Live demo + code",
  },
  {
    id: "kislap", name: "Kislap", tag: "EDTECH", role: "LEAD DEVELOPER · TEAM OF 4",
    desc: "A free reading game for Grades 1–3, with speech recognition that runs entirely in the browser. No servers, no sign-ups.",
    stack: ["React", "TypeScript", "Vite", "Transformers.js", "PWA"], cta: "Play + code",
  },
];

async function drinkCard(d, i) {
  const W = 590, H = 420, pad = 34;
  const desc = wrap(d.desc, W - pad * 2, 18, 0.5);
  let cx = pad, cy = 290;
  const chips = d.stack
    .map((s) => {
      const w = textWidth(s, 14, 0.6) + 24;
      if (cx + w > W - pad) { cx = pad; cy += 38; }
      const out = `<rect x="${cx}" y="${cy - 20}" width="${w}" height="30" rx="15" fill="${C.tint}"/>` + t(cx + w / 2, cy, s, { f: "courier", size: 14, fill: C.inkSoft, anchor: "middle", weight: 700 });
      cx += w + 8;
      return out;
    })
    .join("");
  const ctaW = textWidth(d.cta, 15, 0.52) + 56;
  const tagW = textWidth(d.tag, 12, 0.7) + 26;
  const body = `
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.screen}" stroke="${C.lineStrong}" stroke-width="2"/>
<circle cx="${pad + 30}" cy="66" r="31" fill="${C.tint}"/>
${cup(pad + 29, 70, 0.9, C.accent, true)}
${t(pad + 78, 54, d.role, { size: 12.5, fill: C.label, ls: 2 })}
${t(pad + 76, 92, d.name, { f: "lilita", size: 36, fill: C.ink })}
${t(W - pad, 50, `No. 0${i + 1}`, { f: "courier", size: 16, fill: C.inkMuted, anchor: "end", weight: 700 })}
<rect x="${W - pad - tagW}" y="66" width="${tagW}" height="26" rx="13" fill="none" stroke="${C.accent}" stroke-width="1.8"/>
${t(W - pad - tagW / 2, 84, d.tag, { size: 12, fill: C.accent, anchor: "middle", ls: 2 })}
<line x1="${pad}" y1="122" x2="${W - pad}" y2="122" stroke="${C.lineStrong}" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/>
${desc.map((l, k) => t(pad, 160 + k * 27, l, { size: 18, fill: C.inkSoft })).join("")}
${t(pad, 258, "INGREDIENTS", { size: 12, fill: C.label, ls: 2.4 })}
${chips}
<line x1="${pad}" y1="356" x2="${W - pad}" y2="356" stroke="${C.line}" stroke-width="2"/>
<rect class="cta" x="${W - pad - ctaW}" y="368" width="${ctaW}" height="36" rx="18" fill="${C.accent}"/>
${t(W - pad - ctaW / 2 - 8, 391, d.cta, { size: 15, fill: C.screen, anchor: "middle", weight: 700 })}
<path d="M${W - pad - 26} 386 h12 m-5 -5 l5 5 l-5 5" stroke="${C.screen}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${t(pad, 392, "served at jhez-cafe.vercel.app", { f: "kalam", size: 18, fill: C.inkMuted })}`;
  await save(`drink-${d.id}.svg`, await svg({ w: W, h: H, body, css: STEAM_CSS, title: `${d.name}: ${d.desc}` }));
}

// =====================================================================
// 6. ROAST LOG RECEIPT
// =====================================================================
async function receipt() {
  const W = 640, pad = 46;
  const jobs = [
    ["SOFTWARE ENGINEERING INTERN", "Ed3N Ventures", "JUL 2026 - NOW", [
      "AI-first development across two production projects, directing coding agents",
      "Fintech backend in Next.js 15, TypeScript & PostgreSQL for a creator revenue-financing platform",
      "Channel-agnostic FastAPI backend pairing Telegram & WhatsApp bots",
    ]],
    ["LEAD WEB DEVELOPER", "FEU Tech ACM Student Chapter", "AUG 2025 - AUG 2026", [
      "Led a team of beginner & junior devs building the chapter website",
      "Shipped the Next.js 14 merch shop serving 400+ members",
    ]],
    ["DIRECTOR FOR ACADEMICS", "FEU Tech ACM Student Chapter", "AUG 2024 - AUG 2025", [
      "Ran review sessions & peer tutorials across cohorts",
      "Designed and ran institute-wide competitions",
    ]],
  ];
  const cw = 0.6, fs = 15;
  const maxChars = Math.floor((W - pad * 2) / (fs * cw));
  const line = (y) => `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="${C.inkMuted}" stroke-width="1.4" stroke-dasharray="5 5"/>`;
  const pair = (y, a, b, o = {}) => t(pad, y, a, { f: "courier", size: fs, fill: C.ink, ...o }) + t(W - pad, y, b, { f: "courier", size: fs, fill: C.ink, anchor: "end", ...o });
  let y = 70, parts = [];
  parts.push(t(W / 2, y, "JHEZRA'S CAFÉ", { f: "lilita", size: 34, fill: C.ink, anchor: "middle", ls: 2 }));
  parts.push(t(W / 2, (y += 28), "ROAST LOG · ORDER #2027 · TABLE FOR ONE", { f: "courier", size: 13, fill: C.inkMuted, anchor: "middle", ls: 1 }));
  parts.push(line((y += 24)));
  y += 8;
  for (const [role, org, when, bullets] of jobs) {
    parts.push(t(pad, (y += 30), role, { f: "courier", size: 16, fill: C.accent, weight: 700 }));
    parts.push(pair((y += 22), org, when, { fill: C.inkSoft }));
    for (const b of bullets) {
      const ls = wrap(b, (maxChars - 2) * fs * cw, fs, cw);
      ls.forEach((l, k) => parts.push(t(pad + (k ? 18 : 0), (y += 22), (k ? "" : "+ ") + l, { f: "courier", size: fs, fill: C.ink })));
    }
    y += 10;
  }
  parts.push(line((y += 10)));
  parts.push(t(pad, (y += 30), "ORIGIN", { f: "courier", size: 16, fill: C.accent, weight: 700 }));
  parts.push(pair((y += 22), "FEU Institute of Technology", "CLASS OF 2027"));
  parts.push(t(pad, (y += 22), "BS Computer Science · Software Engineering", { f: "courier", size: fs, fill: C.inkSoft }));
  parts.push(line((y += 22)));
  parts.push(pair((y += 30), "SUBTOTAL", "3 ROLES"));
  parts.push(pair((y += 22), "GPA", "3.8 / 4.00"));
  parts.push(pair((y += 30), "TOTAL", "STILL BREWING", { size: 20, weight: 700 }));
  parts.push(line((y += 22)));
  // barcode
  let bx = W / 2 - 150, bars = "";
  for (let k = 0; bx < W / 2 + 150; k++) { const w = [2, 1, 3, 1, 2, 4, 1][(k * 5) % 7]; bars += `<rect x="${bx}" y="${y + 22}" width="${w}" height="46" fill="${C.ink}"/>`; bx += w + [2, 3, 1, 2][k % 4]; }
  parts.push(bars);
  parts.push(t(W / 2, (y += 92), "thank you, come again!", { f: "kalam", size: 22, fill: C.accent, anchor: "middle" }));
  const H = y + 46;
  // receipt paper with torn zig-zag edges
  const paper = (() => {
    let p = `M0 12`;
    for (let x = 0; x < W; x += 16) p += ` L${x + 8} 2 L${x + 16} 12`;
    p += ` L${W} ${H - 12}`;
    for (let x = W; x > 0; x -= 16) p += ` L${x - 8} ${H - 2} L${x - 16} ${H - 12}`;
    return p + " Z";
  })();
  const body = `
<defs><filter id="sh" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#2b1a10" flood-opacity=".2"/></filter></defs>
<path filter="url(#sh)" d="${paper}" fill="#fffdf8"/>
${parts.join("\n")}`;
  await save("roast-log.svg", await svg({ w: W, h: H, body, title: "Roast log: experience and education receipt" }));
}

// =====================================================================
// 7. ON THE WALL
// =====================================================================
async function wall() {
  const W = 1200, H = 600;
  const frames = [
    ["Competitions", [
      ["Champion", "National IT Skills Olympics · 2026"],
      ["Champion", "CyberXploit CTF · 2026"],
      ["1st Runner-Up", "GDG PUP SEEN CTF · 2026"],
      ["3rd Place", "P&G Next AIdeathon · 2026"],
      ["3rd Place", "OpenAI Campus Hackathon · 2026"],
      ["Top 10 Finalist", "PJDSC & CSSprint Hackathon · 2026"],
      ["Finalist", "Start-A-Ton Datathon · 2026"],
      ["Finalist", "Algolympics · 2025"],
    ]],
    ["Honors", [
      ["DOST-SEI Scholar", "Science Education Institute · ongoing"],
      ["University Elite Scholar", "FEU Institute of Technology"],
      ["Gold Dean's Lister", "every term · 3.8 / 4.00 GPA"],
      ["Top Performing Student", "Rank 2 · 3 · 8 across three A.Y.s"],
      ["TOPCIT Level 3", "Competent · 2025"],
      ["DataCamp Scholar", "2024"],
      ["3rd Runner-Up", "First Gen Code Green · 2024"],
      ["3rd Placer", "Kode Kombat Subservience · 2023"],
    ]],
    ["Certifications", [
      ["AI Engineer for Data Scientists", "DataCamp"],
      ["Associate Data Analyst", "DataCamp"],
      ["IT Specialist: Python", "Certiport"],
      ["Project Management Ready", "PMI"],
      ["Cybersecurity Practitioner", "Palo Alto Networks · in progress"],
    ]],
  ];
  const fw = 356, fh = 486, gap = 26, x0 = (W - (fw * 3 + gap * 2)) / 2;
  const body = `
<defs>
  <pattern id="wallp" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="${C.tint}"/><circle cx="24" cy="24" r="1.6" fill="#e6d3ba"/></pattern>
  <filter id="fs" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#2b1a10" flood-opacity=".22"/></filter>
</defs>
<rect width="${W}" height="${H}" rx="26" fill="url(#wallp)"/>
<rect y="${H - 26}" width="${W}" height="26" fill="#8b5a2c" opacity=".9"/><rect y="${H - 26}" width="${W}" height="4" fill="#6e441d"/>
${frames
  .map(([title, items], i) => {
    const x = x0 + i * (fw + gap), y = 70, rot = [-1.2, 0.8, -0.6][i];
    const cxm = x + fw / 2;
    return `
  <path d="M${cxm} 22 L${x + 60} ${y} M${cxm} 22 L${x + fw - 60} ${y}" stroke="${C.inkMuted}" stroke-width="1.6" fill="none"/>
  <circle cx="${cxm}" cy="22" r="5" fill="${C.ink}"/>
  <g transform="rotate(${rot} ${cxm} ${y + fh / 2})" filter="url(#fs)">
    <rect x="${x}" y="${y}" width="${fw}" height="${fh}" rx="6" fill="${i === 1 ? C.ink : "#8b5a2c"}"/>
    <rect x="${x + 14}" y="${y + 14}" width="${fw - 28}" height="${fh - 28}" rx="3" fill="${C.screen}"/>
    <rect x="${x + 24}" y="${y + 24}" width="${fw - 48}" height="${fh - 48}" fill="none" stroke="${C.lineStrong}"/>
    ${t(cxm, y + 70, title, { f: "lilita", size: 30, fill: C.ink, anchor: "middle" })}
    <path d="M${cxm - 40} ${y + 84} h80" stroke="${C.accent}" stroke-width="3" stroke-linecap="round"/>
    ${items
      .map(([a, b], k) => {
        const yy = y + 124 + k * 44;
        return `<circle cx="${x + 46}" cy="${yy - 5}" r="5" fill="${C.accent}"/>` +
          t(x + 60, yy, a, { size: 16, fill: C.ink, weight: 700 }) +
          t(x + 60, yy + 18, b, { size: 13, fill: C.inkMuted });
      })
      .join("")}
  </g>`;
  })
  .join("")}
${t(W - 40, H - 6, "...and more on the website", { f: "kalam", size: 17, fill: C.screen, anchor: "end" })}`;
  await save("on-the-wall.svg", await svg({ w: W, h: H, body, title: "On the wall: competitions, honors and certifications" }));
}

// =====================================================================
// 8. FOOTER
// =====================================================================
async function footer() {
  const W = 1200, H = 230;
  let awning = "";
  for (let i = 0, x = 0; x < W; i++, x += 60)
    awning += `<path d="M${x} 0 h60 v26 a30 22 0 0 1 -60 0z" fill="${i % 2 ? C.screen : C.accent}"/>`;
  const body = `
<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="28"/></clipPath></defs>
<g clip-path="url(#c)">
  <rect width="${W}" height="${H}" fill="${C.night}"/>
  ${awning}
  ${cup(150, 142, 2, C.accent, true)}
  ${t(W / 2 + 40, 124, "Thanks for stopping by, come back for a refill!", { f: "kalam", size: 36, fill: C.screen, anchor: "middle", weight: 700 })}
  ${t(W / 2 + 40, 166, "JHEZ-CAFE.VERCEL.APP  ·  OPEN DAILY  ·  BREWED WITH AGENTS & A LOT OF COFFEE", { f: "courier", size: 15, fill: "#d9c6ad", anchor: "middle", ls: 1 })}
  <g fill="${C.accent}" opacity=".9">${[0, 1, 2, 3, 4].map((k) => `<ellipse class="bean" style="animation-delay:${k * 0.25}s" cx="${W / 2 - 40 + k * 40}" cy="196" rx="7" ry="10" transform="rotate(30 ${W / 2 - 40 + k * 40} 196)"/>`).join("")}</g>
</g>`;
  const css = `${STEAM_CSS}.bean{animation:beat 2s ease-in-out infinite}@keyframes beat{50%{opacity:.3}}`;
  await save("footer.svg", await svg({ w: W, h: H, body, css, title: "Thanks for stopping by" }));
}

await header();
for (const s of SECTIONS) await sectionSign(s);
await loyalty();
await chalkboard();
for (const [i, d] of DRINKS.entries()) await drinkCard(d, i);
await receipt();
await wall();
await footer();
