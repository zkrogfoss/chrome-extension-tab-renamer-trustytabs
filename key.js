// Same page, same name: drop the #hash, tracking and position params (utm_*, YouTube's t/si/pp…), sort the rest.
const NOISE = /^(utm_.*|fbclid|gclid|dclid|msclkid|mc_[ce]id|igshid|si|feature|pp|ab_channel|ref|ref_src|t|start|index)$/i;

function urlKey(href) {
  const u = new URL(href);
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) if (NOISE.test(k)) u.searchParams.delete(k);
  u.searchParams.sort();
  return u.toString();
}
