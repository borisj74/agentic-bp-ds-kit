// Headings in the kit read in title case: "Billing Settings", not "Billing settings". Section and PageHeader
// run their title through this, so a screen can write its copy either way and still match the rest of the kit.
// Small words stay lowercase inside the line, and a word that already carries a capital (API, iPhone, BuildPartner)
// is left exactly as written.
const SMALL = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "off", "on", "onto",
  "or", "over", "per", "so", "the", "to", "up", "via", "vs", "with", "yet",
]);

function capitalize(word: string) {
  // Skip the leading punctuation of a word like "(draft" so the letter after it is the one raised.
  const at = word.search(/[\p{L}\p{N}]/u);
  if (at < 0) return word;
  return word.slice(0, at) + word[at].toUpperCase() + word.slice(at + 1);
}

function word(raw: string, first: boolean, last: boolean) {
  // Already shouted or camel-cased on purpose: leave it alone.
  if (/[A-Z]/.test(raw)) return raw;
  const plain = raw.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  if (!first && !last && SMALL.has(plain)) return raw.toLowerCase();
  // Hyphenated pairs raise both halves: "Year-End Report".
  return raw.split("-").map(capitalize).join("-");
}

export function titleCase(text: string): string {
  const parts = text.split(/(\s+)/);
  const words = parts.map((_, i) => i).filter((i) => i % 2 === 0 && parts[i] !== "");
  const first = words[0];
  const last = words[words.length - 1];
  return parts.map((p, i) => (i % 2 === 0 && p !== "" ? word(p, i === first, i === last) : p)).join("");
}
