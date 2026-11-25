const $ = (id) => document.getElementById(id);
const input = $("name");

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// Chrome blocks extensions on its own pages (chrome://, the Web Store).
const allowed = /^(https?|file):/.test(tab.url ?? "");
const key = allowed ? urlKey(tab.url) : null;

if (!allowed) {
  $("note").textContent = "The browser doesn't allow renaming this page.";
  $("note").hidden = false;
  for (const id of ["name", "save", "reset"]) $(id).disabled = true;
} else {
  const saved = await chrome.storage.local.get(key);
  input.value = saved[key] ?? tab.title ?? "";
  input.select();
}

// Open tabs of this page pick the change up through storage.onChanged.
async function apply(name) {
  if (name) await chrome.storage.local.set({ [key]: name });
  else await chrome.storage.local.remove(key);
  window.close();
}

$("save").addEventListener("click", () => apply(input.value.trim()));
input.addEventListener("keydown", (e) => e.key === "Enter" && apply(input.value.trim()));
$("reset").addEventListener("click", () => apply(""));

const cmd = (await chrome.commands.getAll()).find((c) => c.name === "_execute_action");
$("keys").textContent = cmd?.shortcut || "not set";
// Browsers only let users change shortcuts on this page; Brave redirects it to brave://.
$("shortcut").addEventListener("click", () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" }));
