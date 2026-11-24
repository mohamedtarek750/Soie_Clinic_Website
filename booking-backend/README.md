# Reception booking integration

The website sends ordinary online booking requests to the selected branch's Google Apps Script URL in `BOOKING_ENDPOINTS` in `src/booking.js`. The public name is Mohandessin. The existing backend branch value is `Mohandseen` and must be preserved for compatibility.

The booking action is `saveWebBooking`. Reception receives the branch, patient name and phone, treatment, preferred date and time. The branch checks availability and confirms the appointment. The Apps Script response is opaque to the browser, so reception's own records establish whether a request was stored.

The WhatsApp fallback prepares a message that the visitor can inspect before sending. Partner plastic surgery consultations use that handoff. They are outside the clinic management system.

For browser tests, intercept the Apps Script POST and WhatsApp navigation before interacting with the form. Exercise validation, branch selection, keyboard submission, success and failure without sending patient or test details to reception. Changes to the external reception system are managed separately from the static Vercel website.
