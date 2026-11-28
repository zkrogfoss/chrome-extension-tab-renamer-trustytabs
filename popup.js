const $ = (id) => document.getElementById(id);
const input = $("name");

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// Chrome blocks extensions on its own pages (chrome://, the Web Store).
const allowed = /^(https?|file):/.test(tab.url ?? "");
const key = allowed ? urlKey(tab.url) : null;
let savedEntry = null; // what storage holds for this page, already checked by parseEntry (icons.js)

if (!allowed) {
  $("note").textContent = "This page can't be renamed.";
  $("note").className = "err"; // the shared popup.css shows only errors in red
  $("note").hidden = false;
  for (const id of ["name", "save", "reset", "iconbtn"]) $(id).disabled = true;
} else {
  const saved = await chrome.storage.local.get(key);
  savedEntry = parseEntry(saved[key]); // a plain name or { name, icon, color }; anything invalid reads as nothing saved
  input.value = savedEntry?.name || tab.title || "";
  input.select();
}

// Open tabs of this page pick the change up through storage.onChanged.
// A plain string when there is only a name (the original format, so older versions still read it); an object once an icon is chosen.
async function save() {
  let name = input.value.trim();
  // An untouched title is not a chosen name: with only an icon picked, the site keeps control of its own title.
  if (!savedEntry?.name && name === (tab.title ?? "")) name = "";
  const value = pick.icon ? { name, icon: pick.icon, color: pick.color } : name;
  if (name || pick.icon) await chrome.storage.local.set({ [key]: value });
  else await chrome.storage.local.remove(key);
  window.close();
}

async function reset() {
  await chrome.storage.local.remove(key); // name and icon both: the tab shows the site's own again
  window.close();
}

$("save").addEventListener("click", save);
input.addEventListener("keydown", (e) => e.key === "Enter" && save());
$("reset").addEventListener("click", reset);

// Tab icon picker. Glyphs are built with createElementNS from the fixed ICONS list in icons.js; nothing is parsed as HTML.
const SVG_NS = "http://www.w3.org/2000/svg";
const NONE_GLYPH = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8"; // "site's own icon"
let pick = { icon: savedEntry?.icon ?? null, color: savedEntry?.color ?? "teal" };

function glyph(id) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  if (id === "dot") {
    const c = document.createElementNS(SVG_NS, "circle");
    for (const [k, v] of Object.entries({ cx: 12, cy: 12, r: 7, fill: "currentColor" })) c.setAttribute(k, v);
    svg.append(c);
  } else {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", id ? ICONS[id] : NONE_GLYPH);
    svg.append(p);
  }
  return svg;
}

function radio(label, checked, onPick) {
  const b = Object.assign(document.createElement("button"), { type: "button", title: label });
  b.setAttribute("role", "radio");
  b.setAttribute("aria-label", label);
  b.setAttribute("aria-checked", String(checked));
  b.addEventListener("click", onPick);
  return b;
}

function drawPicker() {
  $("icons").style.setProperty("--c", COLORS[pick.color]);
  $("colors").replaceChildren(...Object.entries(COLORS).map(([id, hex]) => {
    const b = radio(id, pick.color === id, () => { pick.color = id; drawPicker(); });
    b.style.setProperty("--c", hex);
    return b;
  }));
  $("icons").replaceChildren(...[null, ...Object.keys(ICONS)].map((id) => {
    const b = radio(id ?? "Site's own icon", pick.icon === id, () => { pick.icon = id; drawPicker(); });
    if (!id) b.className = "none";
    b.append(glyph(id));
    return b;
  }));
  const href = pick.icon ? faviconHref(pick.icon, pick.color) : null;
  $("curimg").hidden = !href;
  if (href) $("curimg").src = href;
  $("curtext").hidden = Boolean(href);
}

$("iconbtn").addEventListener("click", () => {
  const open = !$("picker").classList.contains("open");
  $("picker").classList.toggle("open", open);
  $("picker").inert = !open; // closed controls must not take focus
  $("iconbtn").setAttribute("aria-expanded", String(open));
});
drawPicker();

// The list page (options.html) shows and removes every saved name; the number here is how many there are.
const count = Object.keys(await chrome.storage.local.get(null)).length;
$("saved").textContent = count ? `Saved names (${count})` : "Saved names";
$("saved").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

const cmd = (await chrome.commands.getAll()).find((c) => c.name === "_execute_action");
$("keys").textContent = cmd?.shortcut || "not set";
// Browsers only let users change shortcuts on this page; Brave redirects it to brave://.
$("shortcut").addEventListener("click", () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" }));
