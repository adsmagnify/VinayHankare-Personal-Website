export function css(input) {
  if (input == null || input === false || input === "") return undefined;
  if (typeof input === "object") return input;
  const style = {};
  for (const part of String(input).split(";")) {
    const index = part.indexOf(":");
    if (index < 0) continue;
    const raw = part.slice(0, index).trim();
    if (!raw) continue;
    const key = raw.startsWith("--") ? raw : raw.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    style[key] = part.slice(index + 1).trim();
  }
  return style;
}
