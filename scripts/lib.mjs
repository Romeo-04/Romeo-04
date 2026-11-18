// Shared helpers for the café-themed README assets.
// Palette and fonts mirror https://jhez-cafe.vercel.app (globals.css).

export const C = {
  screen: "#fffaf3", // cream page
  tint: "#f5e8d6", // latte
  card: "#ffffff",
  ink: "#2b1a10", // espresso
  inkSoft: "#4a3729",
  inkMuted: "#75594a",
  accent: "#c4552f", // terracotta
  accentHover: "#ab4826",
  label: "#a0482a",
  night: "#1b120c",
  line: "rgba(43,26,16,0.10)",
  lineStrong: "rgba(43,26,16,0.16)",
};

// family -> Google Fonts css2 query
const FAMILIES = {
  lilita: { name: "Lilita One", q: "Lilita+One" },
  varela: { name: "Varela Round", q: "Varela+Round" },
  courier: { name: "Courier Prime", q: "Courier+Prime:wght@400;700" },
  kalam: { name: "Kalam", q: "Kalam:wght@400;700" },
};

export const F = {
  lilita: "'Lilita One', 'Arial Rounded MT Bold', sans-serif",
  varela: "'Varela Round', 'Segoe UI', sans-serif",
  courier: "'Courier Prime', 'Courier New', monospace",
  kalam: "Kalam, 'Comic Sans MS', cursive",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Subset a Google font down to exactly the glyphs an SVG uses, inline as base64 woff2.
async function fontFaces(key, text) {
  const fam = FAMILIES[key];
  const chars = [...new Set(text + " ")].sort().join("");
  const url = `https://fonts.googleapis.com/css2?family=${fam.q}&text=${encodeURIComponent(chars)}`;
  const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  const out = [];
  for (const block of css.match(/@font-face\s*{[^}]+}/g) ?? []) {
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1] ?? "400";
    const src = block.match(/url\(([^)]+)\)/)?.[1];
    if (!src) continue;
    const buf = Buffer.from(await (await fetch(src, { headers: { "User-Agent": UA } })).arrayBuffer());
    out.push(
      `@font-face{font-family:'${fam.name}';font-weight:${weight};src:url(data:font/woff2;base64,${buf.toString("base64")}) format('woff2');}`
    );
  }
  return out.join("");
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

// Collect the text drawn in each font family, by scanning the finished SVG body.
// Elements tag their family with class f-lilita / f-varela / f-courier / f-kalam.
export async function embedFonts(svgBody) {
  const used = { lilita: "", varela: "", courier: "", kalam: "" };
  const re = /<(text|tspan)[^>]*class="[^"]*\bf-(lilita|varela|courier|kalam)\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
  for (const m of svgBody.matchAll(re)) used[m[2]] += decode(m[3].replace(/<[^>]+>/g, ""));
  let css = "";
  for (const [k, t] of Object.entries(used)) if (t) css += await fontFaces(k, t);
  css +=
    `.f-lilita{font-family:${F.lilita}}.f-varela{font-family:${F.varela}}` +
    `.f-courier{font-family:${F.courier}}.f-kalam{font-family:${F.kalam}}`;
  return css;
}

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;");

// Greedy word-wrap using an average glyph width (em fraction) for the font.
export function wrap(text, maxWidth, fontSize, em = 0.56) {
  const max = Math.floor(maxWidth / (fontSize * em));
  const lines = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export const textWidth = (s, fontSize, em = 0.56) => s.length * fontSize * em;

export async function svg({ w, h, body, css = "", title }) {
  const fonts = await embedFonts(body);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${
    title ? ` aria-label="${esc(title)}"` : ""
  }>${title ? `<title>${esc(title)}</title>` : ""}<style>${fonts}${css}</style>${body}</svg>`;
}
