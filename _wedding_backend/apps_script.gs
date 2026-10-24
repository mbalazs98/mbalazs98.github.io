// Google Apps Script backend for the wedding registration pages.
// Stores registrations in the spreadsheet this script is bound to.

const SHEET_NAME = "Registrations";
const HEADERS = ["timestamp", "group", "family", "first", "email", "accommodation", "lang"];

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

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v) {
  // Strip leading formula characters so names can't run as spreadsheet formulas.
  return String(v || "").trim().slice(0, 80).replace(/^[=+\-@]+/, "");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const people = (body.people || []).slice(0, 20);
    if (!people.length) return json_({ ok: false, error: "No people" });
    const group = Utilities.getUuid().slice(0, 8);
    const now = new Date();
    const rows = people.map((p) => [now, group, clean_(p.family), clean_(p.first), clean_(p.email), p.accommodation === true, clean_(body.lang)]);
    if (rows.some((r) => !r[2] || !r[3])) return json_({ ok: false, error: "Missing name" });
    if (rows.some((r) => r[4] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r[4]))) return json_({ ok: false, error: "Bad email" });
    const sh = sheet_();
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Public list: names and group only. Emails and accommodation needs stay private in the sheet.
function doGet() {
  const values = sheet_().getDataRange().getValues().slice(1);
  const attendees = values.map((r) => ({ group: String(r[1]), family: String(r[2]), first: String(r[3]) }));
  return json_({ ok: true, attendees });
}
