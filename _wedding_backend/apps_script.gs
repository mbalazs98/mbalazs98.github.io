// Google Apps Script backend for the wedding registration pages.
// Stores guests in the spreadsheet this script is bound to.

const SHEET_NAME = "Guests";
const HEADERS = ["timestamp", "id", "family", "first", "email", "allergies", "accommodation", "lang", "knows", "token"];
const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i]));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(sh) {
  return sh.getDataRange().getValues().slice(1);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  // Strip leading formula characters so input can't run as spreadsheet formulas.
  return String(v || "").trim().slice(0, max || 80).replace(/^[=+\-@]+/, "");
}

function register_(body) {
  const p = body.person || {};
  const family = clean_(p.family);
  const first = clean_(p.first);
  const email = clean_(p.email, 120);
  if (!family || !first) return { ok: false, error: "Missing name" };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "Bad email" };
  const id = Utilities.getUuid().slice(0, 8);
  const token = Utilities.getUuid();
  const row = [];
  row[COL.timestamp] = new Date();
  row[COL.id] = id;
  row[COL.family] = family;
  row[COL.first] = first;
  row[COL.email] = email;
  row[COL.allergies] = clean_(p.allergies, 300);
  row[COL.accommodation] = p.accommodation === true;
  row[COL.lang] = clean_(body.lang, 5);
  row[COL.knows] = "";
  row[COL.token] = token;
  sheet_().appendRow(row);
  return { ok: true, id, token };
}

// Replaces the list of guests that `id` knows. The token proves it's their own entry.
function connect_(body) {
  const sh = sheet_();
  const rows = rows_(sh);
  const i = rows.findIndex((r) => String(r[COL.id]) === body.id);
  if (i < 0 || !body.token || String(rows[i][COL.token]) !== body.token) return { ok: false, error: "Unknown guest" };
  const ids = new Set(rows.map((r) => String(r[COL.id])));
  const knows = [...new Set(body.knows || [])].filter((k) => ids.has(k) && k !== body.id).slice(0, 500);
  sh.getRange(i + 2, COL.knows + 1).setValue(knows.join(","));
  return { ok: true };
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === "register") return json_(register_(body));
    if (body.action === "connect") return json_(connect_(body));
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Public data: names, ids and who-knows-whom links.
// Emails, allergies, accommodation needs and tokens stay private in the sheet.
function doGet() {
  const rows = rows_(sheet_());
  const attendees = rows.map((r) => ({ id: String(r[COL.id]), family: String(r[COL.family]), first: String(r[COL.first]) }));
  const links = [];
  for (const r of rows) {
    for (const k of String(r[COL.knows]).split(",").filter(Boolean)) links.push({ source: String(r[COL.id]), target: k });
  }
  return json_({ ok: true, attendees, links });
}
