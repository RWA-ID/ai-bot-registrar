// The one place the operator's legal identity lives. When the LLC is renamed (planned: Onchain ID LLC),
// change LEGAL_NAME here, set FORMER_NAME to the old one for a while, and bump LEGAL_UPDATED.
// Add DBA once a trade name is actually filed - until then the pages must not claim one.
export const OPERATOR = {
  LEGAL_NAME: "Only Buy Bitcoin LLC",
  FORMER_NAME: null as string | null,
  DBA: null as string | null, // e.g. "Bot Names" once filed
  STATE: "Delaware",
  // Registered agent's address: makes the operator identifiable and serviceable; not a place of business.
  ADDRESS: ["16192 Coastal Highway", "Lewes, Delaware 19958", "United States"],
};

export const BRAND = "Bot Names";
export const SITE_URL = "https://botnames.dev";
export const X_URL = "https://x.com/botnameservice";
// Cloudflare Email Routing on botnames.dev forwards it; receive-only
export const ABUSE_EMAIL = "abuse@botnames.dev";
export const LEGAL_UPDATED = "October 15, 2026";

/** "Only Buy Bitcoin LLC, a Delaware limited liability company" (+ former name / DBA when set). */
export function operatorLine(): string {
  let s = `${OPERATOR.LEGAL_NAME}, a ${OPERATOR.STATE} limited liability company`;
  if (OPERATOR.FORMER_NAME) s += ` (formerly ${OPERATOR.FORMER_NAME})`;
  if (OPERATOR.DBA) s += `, doing business as ${OPERATOR.DBA}`;
  return s;
}
