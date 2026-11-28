// Tab icons for TrustyTabs: a fixed set of shapes and colours, drawn for this extension on a 24x24 grid. Sends nothing anywhere.
// Storage only ever holds an icon id and a colour id. faviconHref() builds the image from these two lists, and parseEntry() drops
// anything that is not on them, so nothing from a page or from storage can end up inside an image.
const ICONS = Object.freeze({
  dot: "",
  star: "M12 3.3L14.47 9.4L21.04 9.86L16 14.1L17.58 20.49L12 17L6.42 20.49L8 14.1L2.96 9.86L9.53 9.4Z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  flag: "M6 21V4M6 5h11l-2.5 4 2.5 4H6",
  bolt: "M13 3L5 13.5h6L10 21l8-10.5h-6z",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l2 2.5H4zM10 21h4",
  bookmark: "M7 4h10v17l-5-4-5 4z",
  home: "M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  code: "M9 8l-5 4 5 4M15 8l5 4-5 4",
  bug: "M9 8a3 3 0 0 1 6 0M8 8h8v6a4 4 0 0 1-8 0zM4 12h4M16 12h4M5 6l3 2M19 6l-3 2M5 19l3-2M19 19l-3-2",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  cart: "M3 4h3l2 11h10l2-8H7M9 19.5h.01M17 19.5h.01",
  music: "M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  play: "M8 5l11 7-11 7z",
  camera: "M4 8h4l1.5-2h5L16 8h4v11H4zM12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  cloud: "M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 11a3.5 3.5 0 0 1-.5 7z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10",
  pin: "M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  flame: "M12 21c-4 0-6.5-2.7-6.5-6 0-3 2.2-4.5 3.5-7 1 1.5 1.5 2.5 1.5 3.5C11.5 9 13 7 13 4c3 2 5.5 5.5 5.5 10 0 4-2.5 7-6.5 7z",
  briefcase: "M4 8h16v11H4zM9 8V5.5h6V8M4 13h16",
});

const COLORS = Object.freeze({
  teal: "#0f766e", // TrustyTabs' own accent (popup.css data-brand="tabs"), first and the default
  red: "#dc2626", orange: "#ea580c", yellow: "#ca8a04", green: "#16a34a",
  blue: "#2563eb", purple: "#7c3aed", pink: "#db2777", gray: "#52525b",
});

const isIcon = (v) => typeof v === "string" && Object.hasOwn(ICONS, v);
const isColor = (v) => typeof v === "string" && Object.hasOwn(COLORS, v);

// The tab icon as a data: image, or null if the icon or colour is not on the lists. A coloured rounded square with a white glyph
// (the same look as the toolbar icon); "dot" is a plain coloured circle.
function faviconHref(icon, color) {
  if (!isIcon(icon) || !isColor(color)) return null;
  const fill = COLORS[color];
  const body = icon === "dot"
    ? `<circle cx="12" cy="12" r="10.5" fill="${fill}"/>`
    : `<rect width="24" height="24" rx="6" fill="${fill}"/>` +
      `<path transform="translate(4 4) scale(.6667)" d="${ICONS[icon]}" fill="none" stroke="#fff" stroke-width="3" ` +
      `stroke-linecap="round" stroke-linejoin="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// What storage holds for one page: a plain string (a name, the original format) or { name, icon, color }. Returns
// { name, icon, color } with icon and color null when absent or invalid, or null when there is nothing to apply.
function parseEntry(value) {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name, icon: null, color: null } : null;
  }
  if (!value || typeof value !== "object") return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const valid = isIcon(value.icon) && isColor(value.color);
  if (!name && !valid) return null;
  return { name, icon: valid ? value.icon : null, color: valid ? value.color : null };
}
