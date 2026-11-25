// Keeps the saved name on this page (see key.js for what counts as the same page). Sends nothing anywhere.
let key = null;
let wanted = null;
let siteTitle = document.title;

function apply() {
  if (!wanted) {
    siteTitle = document.title;
    return;
  }
  if (document.title === wanted) return;
  siteTitle = document.title; // the site's latest own title, restored on Reset
  document.title = wanted;
}

function show(name) {
  const had = wanted;
  wanted = name ?? null;
  if (wanted) apply();
  else if (had) document.title = siteTitle;
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

// Sites rewrite their own title (unread counts, players); put ours back each time.
new MutationObserver(() => {
  sync();
  apply();
}).observe(document.head ?? document.documentElement, { subtree: true, childList: true, characterData: true });

globalThis.navigation?.addEventListener("navigatesuccess", sync);
sync();
