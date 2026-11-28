// Keeps the saved name and tab icon on this page (see key.js for what counts as the same page; icons.js for the icon list).
// Sends nothing anywhere. The icon is drawn from our own bundled shapes into a data: image, never loaded from the web.
let key = null;
let wanted = null;
let wantedIcon = null; // data: URL of the chosen icon, or null for the site's own
let siteTitle = document.title;
let ourLink = null;
const siteLinks = new Set(); // the site's own icon links, taken out while ours is shown and put back on Reset

function apply() {
  if (!wanted) {
    siteTitle = document.title;
    return;
  }
  if (document.title === wanted) return;
  siteTitle = document.title; // the site's latest own title, restored on Reset
  document.title = wanted;
}

// Browsers pick among several icon links in ways that differ, so ours is the only one while it is active.
// The site's links are kept (not discarded) so Reset can put them back exactly.
function applyIcon() {
  if (!wantedIcon) return;
  if (!ourLink) {
    ourLink = document.createElement("link");
    ourLink.rel = "icon";
    ourLink.type = "image/svg+xml";
    ourLink.setAttribute("sizes", "any");
  }
  if (ourLink.getAttribute("href") !== wantedIcon) ourLink.setAttribute("href", wantedIcon);
  for (const link of document.querySelectorAll('link[rel~="icon"]')) {
    if (link === ourLink) continue;
    siteLinks.add(link);
    link.remove();
  }
  if (!ourLink.isConnected) (document.head ?? document.documentElement).append(ourLink);
}

function restoreIcon() {
  ourLink?.remove();
  for (const link of siteLinks) (document.head ?? document.documentElement).append(link);
  siteLinks.clear();
}

// `value` is what storage holds for this page: a plain name, or { name, icon, color } (parseEntry checks it).
function show(value) {
  const entry = parseEntry(value);
  const had = wanted;
  const hadIcon = wantedIcon;
  wanted = entry?.name || null;
  wantedIcon = entry?.icon ? faviconHref(entry.icon, entry.color) : null;
  if (wanted) apply();
  else if (had) document.title = siteTitle;
  if (wantedIcon) applyIcon();
  else if (hadIcon) restoreIcon();
}

// Sites like YouTube change page without reloading, so the key is re-checked on every change.
async function sync() {
  const k = urlKey(location.href);
  if (k === key) return;
  key = k;
  const saved = await chrome.storage.local.get(k);
  if (k === key) show(saved[k]);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && key in changes) show(changes[key].newValue);
});

// Sites rewrite their own title (unread counts, players) and icon links; put ours back each time.
new MutationObserver(() => {
  sync();
  apply();
  applyIcon();
}).observe(document.head ?? document.documentElement, { subtree: true, childList: true, characterData: true });

globalThis.navigation?.addEventListener("navigatesuccess", sync);
sync();
