import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parseHTML } from "linkedom";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("../Main.dc.html", import.meta.url), "utf8");
const { document } = parseHTML(html);

const style = [...document.querySelectorAll("helmet style, x-dc style")]
  .map((node) => node.textContent || "")
  .join("\n")
  .trim();

const dc = document.querySelector("x-dc");
if (!dc) throw new Error("No <x-dc> root found");

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

const ATTR = {
  class: "className",
  for: "htmlFor",
  onclick: "onClick",
  onchange: "onChange",
  oninput: "onInput",
  onsubmit: "onSubmit",
  onkeydown: "onKeyDown",
  onkeyup: "onKeyUp",
  onkeypress: "onKeyPress",
  onmousedown: "onMouseDown",
  onmouseup: "onMouseUp",
  onmouseenter: "onMouseEnter",
  onmouseleave: "onMouseLeave",
  onfocus: "onFocus",
  onblur: "onBlur",
  ondoubleclick: "onDoubleClick",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  charset: "charSet",
  colspan: "colSpan",
  rowspan: "rowSpan",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  datetime: "dateTime",
  enctype: "encType",
  formaction: "formAction",
  hreflang: "hrefLang",
  inputmode: "inputMode",
  maxlength: "maxLength",
  minlength: "minLength",
  novalidate: "noValidate",
  readonly: "readOnly",
  srcset: "srcSet",
  tabindex: "tabIndex",
  usemap: "useMap",
  viewbox: "viewBox",
  preserveaspectratio: "preserveAspectRatio",
};

function reactAttrName(name) {
  const lower = name.toLowerCase();
  if (ATTR[lower]) return ATTR[lower];
  if (lower.startsWith("aria-") || lower.startsWith("data-")) return lower;
  if (lower.includes("-")) return lower.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return lower;
}

function splitMustache(value) {
  const parts = [];
  const re = /\{\{([\s\S]+?)\}\}/g;
  let last = 0;
  let match;
  while ((match = re.exec(value))) {
    if (match.index > last) parts.push({ type: "text", text: value.slice(last, match.index) });
    parts.push({ type: "expr", expr: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < value.length) parts.push({ type: "text", text: value.slice(last) });
  if (!parts.length) parts.push({ type: "text", text: value });
  return parts;
}

function rewrite(expr, locals) {
  if (/^(true|false|null|undefined|-?\d+(?:\.\d+)?)$/.test(expr)) return expr;
  const match = /^([A-Za-z_$][\w$]*)([\s\S]*)$/.exec(expr);
  if (!match) return expr;
  if (locals.has(match[1])) return expr;
  return `model.${match[1]}${match[2]}`;
}

function exprFromAttr(value) {
  const parts = splitMustache(value);
  if (parts.length === 1 && parts[0].type === "expr") return parts[0].expr;
  throw new Error(`Expected a single binding, got: ${value}`);
}

function emitAttr(name, value, locals) {
  if (name.startsWith("hint-") || name === "data-dc-tpl") return "";
  const reactName = reactAttrName(name);
  const parts = splitMustache(value);

  if (reactName === "style") {
    if (parts.length === 1 && parts[0].type === "expr") {
      return `style={css(${rewrite(parts[0].expr, locals)})}`;
    }
    if (parts.every((part) => part.type === "text")) return `style={css(${JSON.stringify(value)})}`;
    const tmpl = parts
      .map((part) => (part.type === "text" ? part.text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") : `\${${rewrite(part.expr, locals)}}`))
      .join("");
    return `style={css(\`${tmpl}\`)}`;
  }

  if (parts.length === 1 && parts[0].type === "expr") {
    return `${reactName}={${rewrite(parts[0].expr, locals)}}`;
  }
  if (parts.every((part) => part.type === "text")) return `${reactName}=${JSON.stringify(value)}`;
  const tmpl = parts
    .map((part) => (part.type === "text" ? part.text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") : `\${${rewrite(part.expr, locals)}}`))
    .join("");
  return `${reactName}={\`${tmpl}\`}`;
}

function meaningfulText(text) {
  if (!text) return false;
  if (text.includes("{{")) return true;
  if (text.trim()) return true;
  return text.includes(" ");
}

function emitText(text, locals) {
  if (!meaningfulText(text)) return "";
  const parts = splitMustache(text);
  return parts
    .map((part) => {
      if (part.type === "expr") return `{${rewrite(part.expr, locals)}}`;
      if (!part.text) return "";
      return `{${JSON.stringify(part.text)}}`;
    })
    .join("");
}

function elementChildren(node) {
  return [...node.childNodes].filter((child) => child.nodeType === 1 || (child.nodeType === 3 && meaningfulText(child.nodeValue ?? "")));
}

function emitElement(node, locals, indent, keyExpr) {
  const tag = node.localName || node.tagName.toLowerCase();
  const attrs = [...node.attributes]
    .map((attr) => emitAttr(attr.name, attr.value, locals))
    .filter(Boolean);
  if (keyExpr) attrs.unshift(`key={${keyExpr}}`);
  let children = elementChildren(node);
  if (tag === "textarea" && children.length === 1 && children[0].nodeType === 3) {
    const parts = splitMustache(children[0].nodeValue ?? "");
    if (parts.length === 1 && parts[0].type === "expr") {
      attrs.push(`value={${rewrite(parts[0].expr, locals)}}`);
      children = [];
    }
  }
  const attrText = attrs.length ? " " + attrs.join(" ") : "";

  if (VOID.has(tag) || children.length === 0) return `<${tag}${attrText} />`;

  const inner = emitNodes(children, locals, indent + "  ");
  if (!inner.includes("\n")) return `<${tag}${attrText}>${inner.trim()}</${tag}>`;
  return `<${tag}${attrText}>${inner}\n${indent}</${tag}>`;
}

function emitNode(node, locals, indent, keyExpr) {
  if (node.nodeType === 3) return emitText(node.nodeValue ?? "", locals);
  if (node.nodeType !== 1) return "";

  const tag = (node.localName || node.tagName).toLowerCase();
  if (tag === "helmet" || tag === "script" || tag === "style") return "";

  if (tag === "sc-if") {
    const cond = rewrite(exprFromAttr(node.getAttribute("value") || ""), locals);
    const children = elementChildren(node);
    let inner;
    if (children.length === 1 && children[0].nodeType === 1) {
      inner = emitElement(children[0], locals, indent, null);
    } else {
      inner = `<>${emitNodes(children, locals, indent + "  ")}\n${indent}</>`;
    }
    return `{${cond} ? (\n${indent}  ${inner}\n${indent}) : null}`;
  }

  if (tag === "sc-for") {
    const as = node.getAttribute("as") || "item";
    const listExpr = rewrite(exprFromAttr(node.getAttribute("list") || ""), locals);
    const nextLocals = new Set(locals);
    nextLocals.add(as);
    const idx = `${as}Index`;
    const children = elementChildren(node);
    let body;
    if (children.length === 1 && children[0].nodeType === 1) {
      body = emitElement(children[0], nextLocals, indent + "  ", idx);
    } else {
      body = `<Fragment key={${idx}}>${emitNodes(children, nextLocals, indent + "    ")}\n${indent}  </Fragment>`;
    }
    return `{(${listExpr}).map((${as}, ${idx}) => (\n${indent}  ${body}\n${indent}))}`;
  }

  return emitElement(node, locals, indent, keyExpr);
}

function emitNodes(nodes, locals, indent) {
  return nodes
    .map((node) => {
      const piece = emitNode(node, locals, indent);
      return piece ? `\n${indent}${piece}` : "";
    })
    .join("");
}

const top = [...dc.childNodes].filter((node) => {
  if (node.nodeType !== 1) return false;
  const tag = (node.localName || node.tagName).toLowerCase();
  return tag !== "helmet";
});

const jsx = emitNodes(top, new Set(), "    ").trim();
const fragmentImport = jsx.includes("<Fragment") ? `import { Fragment } from "react";\n` : "";
const landing = `${fragmentImport}import { css } from "./css";
import { useLandingModel } from "./useLandingModel";

export default function LandingPage({ accent = "#D6EC1B" }) {
  const model = useLandingModel(accent);
  return (
    ${jsx}
  );
}
`;

function extractRenderVals(source) {
  const marker = "renderVals() {";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("renderVals() not found");
  let i = start + marker.length;
  let depth = 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return source.slice(start + marker.length, i - 1).replaceAll("this.", "self.");
}

const script = document.querySelector("script[data-dc-script]")?.textContent || "";
const body = extractRenderVals(script);
const modelSource = `import { useState } from "react";

export function useLandingModel(accent = "#D6EC1B") {
  const [state, setStateRaw] = useState({});
  const setState = (patch) => {
    setStateRaw((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  };
  const self = { state, setState, props: { accent } };
  return compute(self);
}

function compute(self) {${body}}
`;

mkdirSync(new URL("../src", root), { recursive: true });
writeFileSync(new URL("src/index.css", root), style + "\n", "utf8");
writeFileSync(new URL("src/LandingPage.jsx", root), landing, "utf8");
writeFileSync(new URL("src/useLandingModel.js", root), modelSource, "utf8");

const problems = [];
if (landing.includes("sc-if") || landing.includes("sc-for") || landing.includes("{{")) problems.push("template bindings remain");
if (!landing.includes("Take the free Pipeline Check")) problems.push("hero copy missing");
if (!modelSource.includes("Pipeline Strategy Call")) problems.push("booking logic missing");
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Wrote LandingPage.jsx (${landing.length} chars), useLandingModel.js, index.css (${style.length} chars)`);
