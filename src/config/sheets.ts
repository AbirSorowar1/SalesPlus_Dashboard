// Replace these URLs with your own Google Sheet CSV links.
// Works with "Publish to web → CSV" links, or the gviz export format below
// (sheet must be shared as "Anyone with the link can view").
const SHEET_ID = "1j2viZwmEvp3ywDt2QL-cP593ORLto1wiMSv-l-DR3pk";
const tab = (name: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${name}`;

export const SHEET_URLS = {
  orders: tab("Orders"),
  customers: tab("Customers"),
  products: tab("Products"),
  salesTeam: tab("Sales_Team"),
  marketing: tab("Marketing"),
};

export const REFRESH_INTERVAL_MS = 60_000;
