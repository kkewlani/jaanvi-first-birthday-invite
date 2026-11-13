// ============================================================
//  EDIT THIS FILE ONLY to personalise the invite.
//  Everything marked CHANGE ME is a placeholder.
// ============================================================
window.PARTY = {
  childName: "Jaanvi",
  headline: "Some-bunny is turning ONE!",
  subline: "Hop, hop, hooray, our little bunny is one today!",

  // Growing-up quote (snuggles -> hops -> zoomies). Swap in any of these ideas:
  //  "...and now it's time for wobbly steps, big hops and a whole lot of zoomies!"
  //  "...and next up: tiny hops, giant leaps and chasing every carrot she can find!"
  transitionFrom: "One year of snuggles, giggles and bunny kisses...",
  transitionTo: "...and now it's time to hop, skip and zoom into our next big adventure!",

  // Local time of the party at the venue. Format: YYYY-MM-DDTHH:MM:SS
  startISO: "2026-12-06T15:00:00",
  endISO:   "2026-12-06T17:00:00",
  rsvpBy:   "November 28",
  // RSVPs lock after this moment (the server enforces it too; you can reopen from the Google Sheet menu).
  rsvpDeadlineISO: "2026-11-28T23:59:00-08:00",

  venueName: "Kingsgate Library",
  address:   "12315 NE 143rd St, Kirkland, WA 98034",
  mapsUrl:   "",                                 // optional: paste a Google Maps share link

  hostName:  "Kiran, Kushal & Vikrant",
  // WhatsApp number with country code, digits only (e.g. 15551234567). Used for the
  // "message us" fallback link. Leave "" to hide it.
  hostWhatsApp: "",

  // Paste the Apps Script Web App URL here after deploying backend/Code.gs.
  // While empty, the RSVP form runs in demo mode (nothing is saved).
  apiUrl: "https://script.google.com/macros/s/AKfycbxCdyB233RTuAxwlp_HFr5lcDDQC1lottpMikf1DQtgDRUK2eWdkTi5InmsEQ1aext50Q/exec"
};
