# Website booking → Google Sheet + email (Mohandseen)

When a patient books on the website and picks the **Mohandseen** branch, the
booking is sent to a small Google Apps Script that:

1. adds a row to the **`appointments`** tab of your Google Sheet, and
2. emails reception so they can call the patient back.

New Cairo bookings still open WhatsApp, unchanged.

You only set this up once. Nothing here needs a server, and no payment is
taken online.

---

## One-time setup (about 5 minutes)

### 1. Open the appointments spreadsheet
Open the Google Sheet that holds your appointments. (You don't have to create
the `appointments` tab by hand — the script makes it and writes a header row
the first time a booking arrives. If you prefer, create a tab named exactly
`appointments`.)

### 2. Add the script
- In the sheet, go to **Extensions → Apps Script**.
- Delete whatever code is there, then paste the entire contents of
  [`booking.gs`](booking.gs).
- Near the top, change **`RECEPTION_EMAIL`** to the address that should get the
  alert. For the current test use:
  ```
  var RECEPTION_EMAIL = 'engmohamedtarek123@gmail.com';
  ```
- Click the **Save** icon.

### 3. Publish it as a Web App
- Click **Deploy → New deployment**.
- Click the gear next to "Select type" and choose **Web app**.
- Set:
  - **Execute as:** Me
  - **Who has access:** Anyone
- Click **Deploy**, then **Authorize access** and allow the permissions
  (this is what lets it write to your sheet and send the email).
- Copy the **Web app URL** it shows you (it ends in `/exec`).

### 4. Connect it to the website
Send me that Web app URL and I'll paste it into the site, or do it yourself:
open `script.js`, find this line near the booking code and paste the URL
between the quotes:
```js
var BOOKING_ENDPOINT = '';   // ← paste your /exec URL here
```
Then redeploy the site (a normal git push). Until this URL is set, Mohandseen
bookings safely fall back to WhatsApp, so nothing breaks in the meantime.

### 5. Test it
Open the site's Book page, choose **Mohandseen**, fill in a name and phone,
pick a treatment, date and time, and press **Confirm booking**. Within a few
seconds a new row should appear in the `appointments` tab and an email should
arrive.

---

## Good to know

- **The on-page "Thank you" is optimistic.** Google Apps Script web apps reply
  without the CORS headers a browser needs to read the response, so the site
  can't read a success/failure code back. It shows the confirmation as soon as
  the request is sent. The **sheet row and the email are the real record** —
  check them if you ever doubt a booking arrived.
- **Notifications on your phone:** install the Google Sheets app and open this
  sheet, and/or keep the reception email open. Every booking lands in both.
- **Connecting your own reception system:** if you have a dashboard/app with an
  endpoint, set `RECEPTION_WEBHOOK_URL` in `booking.gs` to its URL; each booking
  will also be POSTed there as JSON. (I couldn't find that system in this
  project — share its URL or code and I'll wire it end to end.)
- **Changing the email later:** edit `RECEPTION_EMAIL`, Save, then
  **Deploy → Manage deployments → Edit → Deploy** to publish the change.
- **Spam:** the endpoint is public (any online form is). For a clinic this is
  usually fine; if you ever get junk, tell me and I'll add a simple check.
