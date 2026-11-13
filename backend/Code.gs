/**
 * Birthday RSVP backend (Google Apps Script, bound to a Google Sheet).
 * Receives RSVPs from the website, stores them in the "RSVPs" sheet,
 * emails confirmations, and sends reminder emails as the date approaches.
 *
 * EDIT THE CONFIG BLOCK BELOW, then follow backend/README.md.
 */

// ===================== CONFIG (CHANGE ME) =====================
var CONFIG = {
  CHILD_NAME: 'Jaanvi',
  HOST_NAME: 'Kiran, Kushal & Vikrant',
  RSVP_DEADLINE: '2026-11-28T23:59:00', // RSVPs lock after this (venue time); reopen from the sheet menu
  EVENT_START: '2026-12-06T15:00:00',   // local time at the venue, same as site/config.js
  EVENT_TIMEZONE: 'America/Los_Angeles', // IANA timezone of the venue
  VENUE: 'Kingsgate Library, 12315 NE 143rd St, Kirkland, WA 98034',
  SITE_URL: 'https://kkewlani.github.io/jaanvi-first-birthday-invite/',
  DEFAULT_COUNTRY_CODE: '1',            // used when a guest types a 10-digit number
  REMINDER_HOUR: 9                      // daily check runs around 9am
};
// ==============================================================

var SHEET_NAME = 'RSVPs';
var HEADERS = ['timestamp', 'name', 'attending', 'adults', 'kids', 'email', 'phone', 'notes',
               'reminder7_sent', 'reminder1_sent', 'whatsapp_link'];
var COL = {}; HEADERS.forEach(function (h, i) { COL[h] = i; });

function eventDate_() { return toDate_(CONFIG.EVENT_START); }

// RSVP gate. Mode is stored in Script Properties and set from the sheet menu "Party Tools":
//   auto   (default) open until RSVP_DEADLINE, closed afterwards
//   open   force open (use this to let people RSVP after the deadline)
//   closed force closed (stop RSVPs early)
function rsvpMode_() { return PropertiesService.getScriptProperties().getProperty('RSVP_MODE') || 'auto'; }
function isOpen_() {
  var mode = rsvpMode_();
  if (mode === 'open') return true;
  if (mode === 'closed') return false;
  return Date.now() <= toDate_(CONFIG.RSVP_DEADLINE).getTime();
}
function setMode_(mode, msg) {
  PropertiesService.getScriptProperties().setProperty('RSVP_MODE', mode);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
}
function modeAuto() { setMode_('auto', 'RSVPs now follow the deadline (' + CONFIG.RSVP_DEADLINE + ').'); }
function modeOpen() { setMode_('open', 'RSVPs are OPEN, even after the deadline.'); }
function modeClosed() { setMode_('closed', 'RSVPs are CLOSED now.'); }

function toDate_(iso) {
  // Interpret a local ISO time (YYYY-MM-DDTHH:MM) in EVENT_TIMEZONE
  var m = iso.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
  var guess = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]));
  var offsetStr = Utilities.formatDate(guess, CONFIG.EVENT_TIMEZONE, 'Z'); // e.g. -0500
  var sign = offsetStr[0] === '-' ? -1 : 1;
  var offMin = sign * (parseInt(offsetStr.slice(1, 3), 10) * 60 + parseInt(offsetStr.slice(3, 5), 10));
  return new Date(guess.getTime() - offMin * 60000);
}
function prettyWhen_() {
  return Utilities.formatDate(eventDate_(), CONFIG.EVENT_TIMEZONE, "EEEE, MMMM d 'at' h:mm a");
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FFD6E4');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function digits_(s) { return String(s || '').replace(/\D/g, ''); }
function normPhone_(s) {
  var d = digits_(s);
  if (!d) return '';
  if (d.length === 10) d = CONFIG.DEFAULT_COUNTRY_CODE + d;
  return d;
}
function clip_(s, n) { return String(s == null ? '' : s).trim().slice(0, n); }
// Prevent spreadsheet formula injection from guest-entered text
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function waLink_(name, phone) {
  var p = normPhone_(phone);
  if (!p) return '';
  var msg = 'Hi ' + name + '! A little reminder: ' + CONFIG.CHILD_NAME + "'s 1st birthday is " + prettyWhen_() +
            ' at ' + CONFIG.VENUE + '. Details: ' + CONFIG.SITE_URL;
  return 'https://wa.me/' + p + '?text=' + encodeURIComponent(msg);
}

// ---------------- Web app endpoints ----------------
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return json_({ ok: true });            // honeypot: pretend success
    if (!isOpen_()) return json_({ ok: false, closed: true, error: 'RSVPs are now closed.' });

    var name = clip_(d.name, 80), email = clip_(d.email, 120).toLowerCase(), phone = clip_(d.phone, 25);
    var attending = ['yes', 'no', 'maybe'].indexOf(d.attending) >= 0 ? d.attending : '';
    if (!name || !attending) return json_({ ok: false, error: 'Please fill in your name and attendance.' });
    if (!email && !phone) return json_({ ok: false, error: 'Please add an email or phone number.' });
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json_({ ok: false, error: 'That email looks invalid.' });

    var adults = Math.max(0, Math.min(10, parseInt(d.adults, 10) || 0));
    var kids = Math.max(0, Math.min(10, parseInt(d.kids, 10) || 0));
    if (attending === 'no') { adults = 0; kids = 0; }
    var notes = clip_(d.notes, 400);

    var sh = sheet_();
    var rows = sh.getDataRange().getValues();
    var key = normPhone_(phone), rowIdx = -1;
    for (var i = 1; i < rows.length; i++) {              // upsert by email or phone
      var re = String(rows[i][COL.email]).toLowerCase(), rp = normPhone_(rows[i][COL.phone]);
      if ((email && re === email) || (key && rp === key)) { rowIdx = i + 1; break; }
    }
    var existing = rowIdx > 0 ? rows[rowIdx - 1] : null;
    var record = [new Date(), safe_(name), attending, adults, kids, safe_(email), safe_(phone), safe_(notes),
                  existing ? existing[COL.reminder7_sent] : '', existing ? existing[COL.reminder1_sent] : '',
                  waLink_(name, phone)];
    if (rowIdx > 0) sh.getRange(rowIdx, 1, 1, HEADERS.length).setValues([record]);
    else sh.appendRow(record);

    if (email) sendConfirmation_(name, email, attending);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Headcount only; never returns personal data.
function doGet() {
  var rows = sheet_().getDataRange().getValues().slice(1), s = { yes: 0, maybe: 0, no: 0, people: 0 };
  rows.forEach(function (r) {
    if (s[r[COL.attending]] !== undefined) s[r[COL.attending]]++;
    if (r[COL.attending] === 'yes') s.people += Number(r[COL.adults]) + Number(r[COL.kids]);
  });
  return json_({ ok: true, open: isOpen_(), summary: s });
}

// ---------------- Email ----------------
function mail_(to, subject, body) {
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: body, name: CONFIG.HOST_NAME });
}
function wrap_(inner) {
  return '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:3px dashed #FFC2D6;border-radius:20px;padding:24px;background:#FFF7FA;color:#7A3E5C">' +
    inner + '<p style="margin-top:24px">With love,<br>' + CONFIG.HOST_NAME + '</p></div>';
}
function details_() {
  return '<p><b>When:</b> ' + prettyWhen_() + '<br><b>Where:</b> ' + CONFIG.VENUE +
         '<br><a href="' + CONFIG.SITE_URL + '" style="color:#E6759F">Party details &amp; update RSVP</a></p>';
}
function sendConfirmation_(name, email, attending) {
  if (attending === 'no') {
    mail_(email, 'Thanks for letting us know', wrap_('<h2>Hi ' + name + '!</h2><p>Thank you for letting us know. We will miss you at ' + CONFIG.CHILD_NAME + "'s first birthday.</p>"));
    return;
  }
  mail_(email, 'RSVP received: ' + CONFIG.CHILD_NAME + "'s 1st birthday",
    wrap_('<h2>Hop, hop, hooray, ' + name + '!</h2><p>We got your RSVP (' + attending + ') for ' + CONFIG.CHILD_NAME + "'s 1st birthday.</p>" + details_()));
}

// ---------------- Reminders ----------------
function reminderEmail_(name, tomorrow) {
  return {
    subject: tomorrow ? 'Tomorrow! ' + CONFIG.CHILD_NAME + "'s 1st birthday" : 'One week to go: ' + CONFIG.CHILD_NAME + "'s 1st birthday",
    body: wrap_('<h2>Hi ' + name + '!</h2><p>' + (tomorrow ? 'Our little bunny turns ONE tomorrow and we can&#39;t wait to see you!' : 'Just one week until our little bunny turns ONE. Hop on over!') + '</p>' + details_())
  };
}

// Sends one copy of each email type to YOUR OWN address only. Touches no guest rows.
function sendTestEmails() {
  var me = Session.getEffectiveUser().getEmail();
  if (!me) { SpreadsheetApp.getUi().alert('Could not find your email address.'); return; }
  var a = reminderEmail_('Test Guest', false), b = reminderEmail_('Test Guest', true);
  mail_(me, '[TEST] RSVP received: ' + CONFIG.CHILD_NAME + "'s 1st birthday",
    wrap_('<h2>Hop, hop, hooray, Test Guest!</h2><p>We got your RSVP (yes) for ' + CONFIG.CHILD_NAME + "'s 1st birthday.</p>" + details_()));
  mail_(me, '[TEST] ' + a.subject, a.body);
  mail_(me, '[TEST] ' + b.subject, b.body);
  SpreadsheetApp.getUi().alert('Sent 3 test emails to ' + me + ' (confirmation, 1-week reminder, 1-day reminder). Check your inbox and spam folder.');
}

function sendReminders() {
  var days = (eventDate_().getTime() - Date.now()) / 86400000;
  if (days < 0) return;                                     // event is over
  var sh = sheet_(), rows = sh.getDataRange().getValues(), sent = 0;
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i], att = r[COL.attending], email = r[COL.email];
    if (!email || att === 'no') continue;
    var which = null;
    if (days <= 1.5 && !r[COL.reminder1_sent]) which = 'reminder1_sent';
    else if (days <= 7.5 && days > 1.5 && !r[COL.reminder7_sent]) which = 'reminder7_sent';
    if (!which) continue;
    if (MailApp.getRemainingDailyQuota() < 1) break;
    var rem = reminderEmail_(r[COL.name], which === 'reminder1_sent');
    mail_(email, rem.subject, rem.body);
    sh.getRange(i + 1, COL[which] + 1).setValue(new Date());
    if (which === 'reminder1_sent') sh.getRange(i + 1, COL.reminder7_sent + 1).setValue(r[COL.reminder7_sent] || 'skipped');
    sent++;
  }
  console.log('Reminder emails sent: ' + sent);
  return sent;
}

// ---------------- Sheet menu & setup ----------------
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Party Tools')
    .addItem('Send me a test email (to myself only)', 'sendTestEmails')
    .addItem('Send due reminders now', 'menuSendReminders')
    .addItem('Rebuild WhatsApp message links', 'rebuildLinks')
    .addItem('Set up daily reminder trigger', 'setupTriggers')
    .addSeparator()
    .addItem('RSVPs: follow deadline (default)', 'modeAuto')
    .addItem('RSVPs: force OPEN (after deadline)', 'modeOpen')
    .addItem('RSVPs: force CLOSED now', 'modeClosed')
    .addToUi();
}
function menuSendReminders() {
  var n = sendReminders();
  SpreadsheetApp.getUi().alert('Reminder emails sent: ' + (n || 0));
}
function rebuildLinks() {
  var sh = sheet_(), rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) sh.getRange(i + 1, COL.whatsapp_link + 1).setValue(waLink_(rows[i][COL.name], rows[i][COL.phone]));
}
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sendReminders') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(CONFIG.REMINDER_HOUR).create();
  try { SpreadsheetApp.getUi().alert('Daily reminder check is set for about ' + CONFIG.REMINDER_HOUR + ':00.'); } catch (e) {}
}
