// One-off READ-ONLY: resolve Sales Orders and existing Tasks for events in the
// "missing Striven links" digest. No writes.
const BASE = "https://api.striven.com";
const SOS = ["586602", "586938", "586425", "586855", "586874", "584901", "586293", "586722", "583609", "587001", "587174", "57174"];
const CUSTOMER_SEARCHES = [
  { label: "Wortley", body: { Name: "Wortley" } },
  { label: "Wortley-phone", body: { Phone: "4169924467" } },
  { label: "Ungar", body: { Name: "Ungar" } },
];

async function token() {
  const id = process.env.STRIVEN_CLIENT_ID, secret = process.env.STRIVEN_CLIENT_SECRET;
  const r = await fetch(`${BASE}/accesstoken`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", ClientId: id }),
  });
  if (!r.ok) throw new Error(`token HTTP ${r.status}`);
  return (await r.json()).access_token;
}
let T;
async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, { method, headers: { Accept: "application/json", Authorization: `Bearer ${T}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  if (!r.ok) { console.log(`${method} ${path} -> HTTP ${r.status} ${text.slice(0, 300)}`); return null; }
  return text ? JSON.parse(text) : null;
}
const rows = (p) => p?.data ?? p?.Data ?? [];
const out = (k, v) => console.log(`${k} ${JSON.stringify(v)}`);

async function tasksForCustomer(customerId) {
  const res = [];
  for (let page = 0; page < 3; page++) {
    const p = await api("POST", "/v2/tasks/search", { PageIndex: page, PageSize: 50, Customer: { Id: customerId } });
    const r = rows(p); res.push(...r);
    if (r.length < 50) break;
  }
  return res;
}

async function main() {
  T = await token();
  const taskCache = new Map();
  for (const num of SOS) {
    const so = rows(await api("POST", "/v1/sales-orders/search", { Number: num, PageSize: 5 }));
    const exact = so.filter((s) => String(s.number ?? s.Number) === num);
    if (exact.length !== 1) { out("SO_NOT_UNIQUE", { num, found: so.map((s) => ({ id: s.id, number: s.number, customer: s.customer?.name })) }); continue; }
    const s = exact[0];
    out("SO", { num, id: s.id, name: s.name, customer: s.customer, status: s.status, orderDate: s.orderDate });
    const custId = s.customer?.id;
    if (!custId) continue;
    if (!taskCache.has(custId)) taskCache.set(custId, await tasksForCustomer(custId));
    const tasks = taskCache.get(custId);
    for (const t of tasks) {
      const d = await api("GET", `/v2/tasks/${t.id}`);
      if (!d) continue;
      const linked = d.salesOrder?.id === s.id;
      out(linked ? "TASK_ON_SO" : "TASK_OTHER", { so: num, id: d.id, title: d.title, type: d.type?.name, status: d.status?.name, start: d.startDateTime, due: d.dueDateTime, salesOrder: d.salesOrder, assignments: (d.assignments || []).map((a) => a.name) });
    }
  }
  for (const c of CUSTOMER_SEARCHES) {
    const r = rows(await api("POST", "/v1/customers/search", { ...c.body, PageSize: 10 }));
    out("CUSTOMER_SEARCH", { label: c.label, results: r.map((x) => ({ id: x.id, number: x.number, name: x.name, phone: x.phone ?? x.phones })) });
    for (const x of r.slice(0, 3)) {
      const tasks = await tasksForCustomer(x.id);
      out("CUSTOMER_TASKS", { label: c.label, customer: x.id, tasks: tasks.map((t) => ({ id: t.id, title: t.title, type: t.type?.name, status: t.status?.name })) });
      const sos = rows(await api("POST", "/v1/sales-orders/search", { CustomerId: x.id, PageSize: 20 }));
      out("CUSTOMER_SOS", { label: c.label, customer: x.id, sos: sos.map((s) => ({ id: s.id, number: s.number, name: s.name, status: s.status?.name })) });
    }
  }
  console.log("READ-ONLY: no writes performed");
}
main().catch((e) => { console.error(e.message); process.exit(1); });
