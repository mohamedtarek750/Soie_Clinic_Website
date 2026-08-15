/**
 * Soie Clinic - booking receiver (Google Apps Script)
 *
 * Bound to the appointments spreadsheet and published as a Web App. It
 * receives a JSON booking from the website, appends a row to the
 * "appointments" tab, and emails reception. Optionally it can also forward
 * the booking to your own reception system. See SETUP-booking.md.
 */

// ── Config: edit these three, then Deploy ────────────────────────────────
var SHEET_NAME           = 'appointments';            // tab that stores bookings
var RECEPTION_EMAIL      = 'YOUR_EMAIL@example.com';  // who gets the notification email
var RECEPTION_WEBHOOK_URL = '';                       // optional: your reception system endpoint

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // write a header row the first time the sheet is used
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Received', 'Branch', 'Name', 'Phone', 'Treatment', 'Date', 'Time', 'Source']);
    }

    sheet.appendRow([
      new Date(),
      data.branch   || '',
      data.name     || '',
      data.phone    || '',
      data.service  || '',
      data.dateText || data.date || '',
      data.time     || '',
      data.source   || 'website'
    ]);

    notifyReception(data);
    if (RECEPTION_WEBHOOK_URL) forwardToSystem(data);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function notifyReception(data) {
  if (!RECEPTION_EMAIL || RECEPTION_EMAIL === 'YOUR_EMAIL@example.com') return;
  var subject = 'New booking - ' + (data.name || 'Patient') + ' (' + (data.phone || 'no phone') + ')';
  var body =
    'A new appointment request came in from the website.\n\n' +
    'Branch:    ' + (data.branch   || '') + '\n' +
    'Name:      ' + (data.name     || '') + '\n' +
    'Phone:     ' + (data.phone    || '') + '\n' +
    'Treatment: ' + (data.service  || '') + '\n' +
    'Date:      ' + (data.dateText || data.date || '') + '\n' +
    'Time:      ' + (data.time     || '') + '\n\n' +
    'Please call the patient to confirm the appointment.';
  MailApp.sendEmail(RECEPTION_EMAIL, subject, body);
}

// Optional: push the same booking to your reception system, if you have one.
function forwardToSystem(data) {
  try {
    UrlFetchApp.fetch(RECEPTION_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    });
  } catch (err) { /* reception system is optional; ignore failures */ }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Open the Web App URL in a browser to confirm it is reachable.
function doGet() {
  return json({ ok: true, service: 'Soie booking receiver' });
}
