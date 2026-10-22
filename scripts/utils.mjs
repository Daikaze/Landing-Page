export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
export function clamp(number, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(Number(number)) ? Number(number) : min));
}
export function safeAsset(value) {
  const src = String(value ?? "").trim();
  if (!src || /^(?:javascript|data|vbscript):/i.test(src) || /[\n\r\t<>"'\\]/.test(src)) return "";
  return src;
}
export function image(value) { return safeAsset(value) || ""; }
export const fa = {
  compass: "fa-compass", heroes: "fa-users", map: "fa-map", quests: "fa-scroll", recaps: "fa-book-open",
  play: "fa-play", close: "fa-xmark", gear: "fa-gear", back: "fa-arrow-left", music: "fa-music",
  audioOff: "fa-volume-xmark", audioOn:"fa-volume-high", star:"fa-star", flag:"fa-location-dot"
};
export function icon(name) { return `<i class="fa-solid ${fa[name] || name}" aria-hidden="true"></i>`; }
export function makeTextParagraphs(input) {
  return String(input ?? "").split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("");
}
