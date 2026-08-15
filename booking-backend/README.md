# Mohandseen online booking → Soie System

When a patient books on the website and picks the **Mohandseen** branch, the
booking is sent to the **Soie System (Mohandseen)** — the reception Apps Script
web app — where it shows up in a new **Requests** tab with the patient's phone,
and reception also gets an email. New Cairo still hands off to WhatsApp.

- Website side: `script.js` posts the booking (with `action: "saveWebBooking"`)
  to the system's web app URL, held in `BOOKING_ENDPOINT`.
- System side: the reception app repo
  (`Soie_System_Mohandeseen`) gained a small, self-contained intake:
  - `App.gs`: `saveWebBooking` / `markWebBooking` / `webBookings` actions that
    write to a `WebBookings` tab (with a **Phone** column) and email reception.
  - `index.html`: a **Requests** dashboard tab (with a count badge) to read the
    requests, call the phone, and mark each one done.

## Going live (one time)

The website already points at the system's current web app URL. You just need
to publish the system's new code:

1. Open the **Soie System (Mohandseen)** Apps Script project.
2. Update **`App.gs`** and **`index.html`** with the new versions from the
   `Soie_System_Mohandeseen` repo (copy-paste, or pull the repo).
3. **Deploy → Manage deployments → (edit the existing deployment) →
   Version: New version → Deploy.** Editing the existing deployment keeps the
   **same `/exec` URL**, so the website keeps working with no further change.
   (If you ever create a *new* deployment instead, its URL changes — send me
   the new URL and I'll update `BOOKING_ENDPOINT`.)
4. Test: book on the site as Mohandseen. The row appears in the **Requests**
   tab and an email arrives.

## Notes

- **Notification email** goes to the Google account that owns the script by
  default. To send it elsewhere, set `WEB_BOOKING_EMAIL` at the top of the
  Website-requests section in `App.gs`.
- The on-page "Thank you" is optimistic (Apps Script web apps answer without
  CORS headers, so the browser can't read the reply). The **Requests tab and
  the email are the record of truth**.
- Until the system is redeployed with the new code, Mohandseen bookings safely
  fall back to WhatsApp only if `BOOKING_ENDPOINT` is blank. It is currently
  set, so **redeploy the system before relying on it** — otherwise a booking
  shows the thank-you but is not stored.
