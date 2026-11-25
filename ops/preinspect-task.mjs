// One-off: create the missing Striven pre-inspection Task for calendar event
// "63351 - Ahmed Kayka - (647) 272-8511" (Nov 25, 2026). Without ops/create-spec.json it is read-only.
const BASE = "https://api.striven.com";
const MODE = process.env.MODE || "discover";
const CUSTOMER_ID = 63351;
const TEMPLATE_TASK_IDS = [20074, 20068, 20125];

async function token() {
  const id = process.env.STRIVEN_CLIENT_ID, secret = process.env.STRIVEN_CLIENT_SECRET;
  const r = await fetch(`${BASE}/accesstoken`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", ClientId: id }),
  });
  if (!r.ok) throw new Error(`token HTTP ${r.status}`);
  return (await r.json()).access_token;
}

let T;
async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { Accept: "application/json", Authorization: `Bearer ${T}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  console.log(`${method} ${path} -> HTTP ${r.status}`);
  if (!r.ok) { console.log(text.slice(0, 2000)); throw new Error(`HTTP ${r.status}`); }
  return text ? JSON.parse(text) : null;
}

const pick = (t) => ({
  Id: t.Id, Title: t.Title, Type: t.Type, Status: t.Status, Priority: t.Priority,
  Customer: t.Customer, Location: t.Location, StartDateTime: t.StartDateTime,
  DueDateTime: t.DueDateTime, SalesOrder: t.SalesOrder, RequestedBy: t.RequestedBy,
  Assignments: t.Assignments, CreatedBy: t.CreatedBy, Description: (t.Description || "").slice(0, 300),
});

async function main() {
  T = await token();
  const cust = await api("GET", `/v1/customers/${CUSTOMER_ID}`);
  console.log("CUSTOMER", JSON.stringify({ Id: cust.Id, Number: cust.Number, Name: cust.Name, Phones: cust.Phones, PrimaryAddress: cust.PrimaryAddress }, null, 1));
  const locs = await api("GET", `/v1/customers/${CUSTOMER_ID}/locations`);
  console.log("LOCATIONS", JSON.stringify(locs, null, 1).slice(0, 3000));
  const existing = await api("POST", "/v2/tasks/search", { PageIndex: 0, PageSize: 50, Customer: { Id: CUSTOMER_ID } });
  console.log("EXISTING_TASKS", JSON.stringify(existing, null, 1).slice(0, 4000));
  for (const id of TEMPLATE_TASK_IDS) {
    console.log("TEMPLATE", JSON.stringify(pick(await api("GET", `/v2/tasks/${id}`)), null, 1));
  }
  if (MODE !== "create") { console.log("MODE=discover: no writes performed"); return; }

  const spec = JSON.parse(process.env.CREATE_SPEC_JSON);
  const rows = existing?.Data ?? existing?.data ?? [];
  const dup = rows.find((t) => t.Type?.Id === spec.Type?.Id);
  if (dup) { console.log("ALREADY_EXISTS", JSON.stringify(dup)); return; }
  const created = await api("POST", "/v2/tasks", spec);
  console.log("CREATED_TASK_ID", created.Id);
  console.log("VERIFY", JSON.stringify(pick(await api("GET", `/v2/tasks/${created.Id}`)), null, 1));
}
main().catch((e) => { console.error(e.message); process.exit(1); });
