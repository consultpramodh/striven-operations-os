// One-off: customer 63351 has no location. Create a Primary location from the calendar
// event address, then set it on Pre Inspection task 20140. Guarded: skips create if any location exists.
const BASE = "https://api.striven.com";
const CUSTOMER_ID = 63351;
const TASK_ID = 20140;
const LOCATION = {
  Id: 0,
  Name: "Primary Location",
  IsPrimary: true,
  Address: {
    Address1: "4025 Highway 35 S / Highway 115 South",
    City: "Clarington",
    State: "ON",
    PostalCode: "L1B 0R6",
    Country: "CA",
  },
};

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
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}
const rows = (p) => p?.data ?? p?.Data ?? [];
const idOf = (o) => o?.id ?? o?.Id;

async function main() {
  T = await token();
  console.log("REFERENCE_63368_LOCATIONS", JSON.stringify(await api("GET", "/v1/customers/63368/locations"), null, 1));
  const before = rows(await api("GET", `/v1/customers/${CUSTOMER_ID}/locations`));
  let loc;
  if (before.length > 0) {
    loc = before.find((l) => l.isPrimary ?? l.IsPrimary) ?? before[0];
    console.log("LOCATION_ALREADY_EXISTS", JSON.stringify(loc));
  } else {
    loc = await api("POST", `/v1/customers/${CUSTOMER_ID}/location`, LOCATION);
    console.log("CREATED_LOCATION", JSON.stringify(loc, null, 1));
  }
  const locId = idOf(loc);
  if (!locId) throw new Error("No location id");
  console.log("VERIFY_LOCATIONS", JSON.stringify(await api("GET", `/v1/customers/${CUSTOMER_ID}/locations`), null, 1));
  const task = await api("GET", `/v2/tasks/${TASK_ID}`);
  if (idOf(task.customer ?? task.Customer) !== CUSTOMER_ID) throw new Error("Task customer mismatch");
  await api("PATCH", `/v2/tasks/${TASK_ID}`, { Location: { Id: locId } });
  const after = await api("GET", `/v2/tasks/${TASK_ID}`);
  console.log("VERIFY_TASK", JSON.stringify({ id: after.id, title: after.title, customer: after.customer, location: after.location, type: after.type, startDateTime: after.startDateTime, dueDateTime: after.dueDateTime, assignments: after.assignments }, null, 1));
}
main().catch((e) => { console.error(e.message); process.exit(1); });
