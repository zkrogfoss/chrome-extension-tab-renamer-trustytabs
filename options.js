// Lists every saved name (storage holds "page address -> name") and removes them. Sends nothing anywhere.
const $ = (id) => document.getElementById(id);
let rows = [];

const plural = (n) => `${n} saved name${n === 1 ? "" : "s"}`;

async function load() {
  const all = await chrome.storage.local.get(null);
  // parseEntry (icons.js) accepts a plain name or { name, icon, color } with icon and colour from our fixed lists;
  // anything else in storage is ignored, never shown or trusted. An icon without a name is listed by its address.
  rows = Object.entries(all)
    .map(([key, value]) => ({ key, entry: parseEntry(value) }))
    .filter((r) => r.entry)
    .map(({ key, entry }) => ({ key, name: entry.name, icon: entry.icon && faviconHref(entry.icon, entry.color) }))
    .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key) || a.key.localeCompare(b.key));
  render();
}

function render() {
  const q = $("q").value.trim().toLowerCase();
  const shown = rows.filter((r) => !q || (r.name || "icon only").toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
  $("count").textContent = !rows.length ? "" : q ? `${shown.length} of ${plural(rows.length)}` : plural(rows.length);
  $("empty").hidden = rows.length > 0;
  $("tools").hidden = rows.length === 0;
  $("clear").disabled = rows.length === 0;

  // Built with createElement and textContent only: names and addresses come from the web and are never parsed as HTML.
  $("list").replaceChildren(...shown.map((r) => {
    const li = document.createElement("li");
    const text = document.createElement("div");
    text.className = "text";
    const label = r.name || "Icon only"; // a page with a chosen icon and no name
    const name = Object.assign(document.createElement("span"), { className: "name", textContent: label });
    const addr = Object.assign(document.createElement("span"), { className: "addr", textContent: r.key.replace(/^https?:\/\//, "") });
    addr.title = r.key;
    text.append(name, addr);
    const remove = Object.assign(document.createElement("button"), { className: "btn", type: "button", textContent: "Remove" });
    remove.setAttribute("aria-label", `Remove ${label}`);
    remove.addEventListener("click", () => chrome.storage.local.remove(r.key)); // the list reloads through onChanged
    if (r.icon) {
      const img = Object.assign(document.createElement("img"), { className: "ico", alt: "", src: r.icon });
      li.append(img);
    }
    li.append(text, remove);
    return li;
  }));
}

$("q").addEventListener("input", render);
$("clear").addEventListener("click", () => {
  if (!rows.length || !confirm(`Remove all ${plural(rows.length)}? Open tabs get their own titles back.`)) return;
  chrome.storage.local.remove(rows.map((r) => r.key)); // only the names listed here, not everything in storage
});
// Names saved or removed anywhere (the popup, another tab of this page) show up here without a reload.
chrome.storage.onChanged.addListener((_changes, area) => { if (area === "local") load(); });

load();
