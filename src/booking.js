/* Appointment requests. The static form already contains branch and service choices. */
(function () {
  'use strict';
  const { $, $$, on, translate, displayTime, isArabic, measure } = window.SoieBookingUI;
  const arabic = {
    "Monday": "الإثنين",
    "Tuesday": "الثلاثاء",
    "Wednesday": "الأربعاء",
    "Thursday": "الخميس",
    "Friday": "الجمعة",
    "Saturday": "السبت",
    "Sunday": "الأحد",
    "New Cairo": "القاهرة الجديدة",
    "Mohandseen": "المهندسين",
    "Treatment": "العلاج",
    "Choose a date to see the available times.": "اختر التاريخ لتظهر لك المواعيد المتاحة.",
    "Branch": "الفرع",
    "Name": "الاسم",
    "Not set": "لم يُحدد",
    "Phone": "الهاتف",
    "Consultation": "استشارة",
    "Date": "التاريخ",
    "Time": "الوقت",
    "Confirm via WhatsApp": "تأكيد عبر واتساب",
    "WhatsApp will open with your appointment details ready to send. Reception will reply to confirm availability. There is no online payment.": "سيفتح واتساب وبيانات موعدك جاهزة للإرسال. سيرد فريق الاستقبال لتأكيد توفر الموعد. لا يوجد دفع عبر الموقع.",
    "No times are left today. Please choose another date.": "لا توجد مواعيد متبقية اليوم. اختر تاريخًا آخر.",
    "Enter your full name.": "أدخل اسمك بالكامل.",
    "Enter your full name, at least two characters.": "أدخل اسمك بالكامل، حرفين على الأقل.",
    "Enter the phone number we should call you on.": "أدخل رقم الهاتف الذي يمكننا التواصل معك عليه.",
    "Enter at least eight digits of your phone number.": "أدخل ثمانية أرقام على الأقل من رقم هاتفك.",
    "Choose the date you would like to visit.": "اختر تاريخ الزيارة المناسب لك.",
    "Choose today or a later date.": "اختر اليوم أو تاريخًا لاحقًا.",
    "No times are left on that date. Choose another day.": "لا توجد أوقات متبقية في هذا التاريخ. اختر يومًا آخر.",
    "Choose one of the times shown.": "اختر أحد الأوقات الظاهرة.",
    "Send booking request": "إرسال طلب الحجز",
    "Your request goes to our {branch} reception. They will contact you to confirm availability. There is no online payment.": "يصل طلبك إلى استقبال فرع {branch}. سيتواصلون معك لتأكيد توفر الموعد. لا يوجد دفع عبر الموقع.",
    "We could not reach our booking system. Please try again, or use the WhatsApp button to send your details to reception.": "تعذر الاتصال بنظام الحجز. حاول مرة أخرى، أو استخدم زر واتساب لإرسال بياناتك إلى الاستقبال.",
    "Sending your request...": "جارٍ إرسال طلبك...",
    "Enter your preferred time. Reception will confirm availability.": "أدخل الوقت الذي يناسبك. سيؤكد فريق الاستقبال توفر الموعد.",
    "Hello! I would like to book an appointment.": "مرحبًا، أود حجز موعد."
  };
  const t = (value, variables) => translate(arabic, value, variables);

  var form = $('#bkForm');
  if (!form) return;

  // ── Where each branch's bookings are sent ────────────────────────────
  // Each branch posts to its own Soie System web app, which adds the booking
  // to that branch's Requests inbox (with the patient's phone) and emails
  // reception. A blank URL makes that branch fall back to the WhatsApp
  // handoff, so nothing is lost before a system is wired up.
  var BOOKING_ENDPOINTS = {
    'New Cairo':  'https://script.google.com/macros/s/AKfycbzhChuuZ4KKdi493yhwvLGYE7c7QkKFE0SsRbFfPNlx6FRNSeAPQVp0MRkbdQhOaTE/exec',
    'Mohandseen': 'https://script.google.com/macros/s/AKfycbwOHDi6U6MYSM-YMnZNCIn0Dhrvm3YE724wCuuLGJWxCT57ja01R6ReY7AN6yzKYu81ZQ/exec'
  };

  var serviceSel = $('#bkService');
  var dateInput  = $('#bkDate');
  var slotsWrap  = $('#bkSlots');
  var nameInput  = $('#bkName');
  var phoneInput = $('#bkPhone');
  var submit     = $('#bkSubmit');
  var submitLabel = $('#bkSubmitLabel');
  var waIcon     = $('#bkWaIcon');
  var note       = $('#bkNote');
  var done       = $('#bkDone');
  var summary     = $('#bkSummary');
  var summaryList = $('#bkSummaryList');
  var nameErr     = $('#bkNameErr');
  var phoneErr    = $('#bkPhoneErr');
  var sum = {
    branch:  $('#sumBranch'),
    name:    $('#sumName'),
    phone:   $('#sumPhone'),
    service: $('#sumService'),
    date:    $('#sumDate'),
    time:    $('#sumTime')
  };
  var selectedTime = '';
  var sent = false;
  var sending = false;      // a post is in flight; do not start a second one
  var postFailed = false;   // the request never left the device

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function fmt12(h, minute) {
    var ampm = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + (minute || '00') + ' ' + ampm;
  }

  // limit the calendar to today → +60 days
  var today = new Date();
  var max = new Date(today.getTime() + 60 * 24 * 3600 * 1000);
  if (dateInput) {
    dateInput.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    dateInput.max = max.getFullYear() + '-' + pad(max.getMonth() + 1) + '-' + pad(max.getDate());
  }

  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el || null;
  }

  function prettyDate(val, canonical) {
    if (!val) return t('Not set');
    var parts = val.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (isArabic() && !canonical) return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function buildSlots() {
    if (!slotsWrap || !dateInput) return;
    selectedTime = '';
    slotsWrap.innerHTML = '';
    var val = dateInput.value;
    if (!val) {
      slotsWrap.innerHTML = '<p class="slots__hint"></p>';
      $('.slots__hint', slotsWrap).textContent = t('Choose a date to see the available times.');
      update();
      return;
    }
    var parts = val.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var hours = JSON.parse(checked('bkBranch').dataset.hours);
    if (!hours.length) {
      var prompt = t('Enter your preferred time. Reception will confirm availability.');
      var label = document.createElement('label');
      label.className = 'bk__field';
      label.textContent = prompt;
      var preferred = document.createElement('input');
      preferred.type = 'time';
      preferred.id = 'bkPreferredTime';
      if (val === todayStr()) {
        var current = new Date();
        preferred.min = pad(current.getHours()) + ':' + pad(current.getMinutes());
      }
      label.appendChild(preferred);
      slotsWrap.appendChild(label);
      on(preferred, 'input', function () {
        var time = preferred.value.split(':');
        selectedTime = preferred.value && preferred.validity.valid ? fmt12(Number(time[0]), time[1]) : '';
        update();
      });
      update();
      return;
    }
    var day = ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()];
    var schedule = hours.find(function (entry) { return entry.days.includes(day); });
    var open = schedule ? Number(schedule.opens.split(':')[0]) : 0;
    var close = schedule ? Number(schedule.closes.split(':')[0]) : 0;
    var now = new Date();
    var isToday = d.toDateString() === now.toDateString();
    var added = 0;
    for (var h = open; h < close; h++) {
      if (isToday && h <= now.getHours()) continue; // no past slots today
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.setAttribute('data-time', fmt12(h));
      b.textContent = displayTime(fmt12(h));
      (function (btn) {
        on(btn, 'click', function () {
          $$('.slot', slotsWrap).forEach(function (s) { s.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          selectedTime = btn.getAttribute('data-time');
          update();
        });
      })(b);
      slotsWrap.appendChild(b);
      added++;
    }
    if (!added) {
      slotsWrap.innerHTML = '<p class="slots__hint"></p>';
      $('.slots__hint', slotsWrap).textContent = t('No times are left today. Please choose another date.');
    }
    update();
  }

  // Some treatments run at one branch only (dentistry and veneers are
  // Mohandseen only). Hide those options when another branch is chosen,
  // and fall back to Consultation if the picked treatment is not offered
  // at the newly selected branch.
  function syncServiceOptions() {
    if (!serviceSel) return;
    var branchEl = checked('bkBranch');
    var branch = branchEl ? branchEl.value : 'New Cairo';
    var reset = false;
    $$('option[data-branch]', serviceSel).forEach(function (opt) {
      var allowed = opt.getAttribute('data-branch') === branch;
      opt.hidden = !allowed;
      opt.disabled = !allowed;
      if (!allowed && opt.selected) reset = true;
    });
    if (reset) serviceSel.value = 'Consultation';
  }

  function normaliseDigits(s) {
    return (s || '').replace(/[٠-٩۰-۹]/g, function (digit) {
      var code = digit.charCodeAt(0);
      return String(code >= 0x6F0 ? code - 0x6F0 : code - 0x660);
    });
  }
  function digits(s) { return normaliseDigits(s).replace(/\D/g, ''); }
  function phoneValid() { return digits(phoneInput ? phoneInput.value : '').length >= 8; }
  function currentBranch() {
    var b = checked('bkBranch');
    return b ? b.value : 'New Cairo';
  }
  function branchEndpoint() { return BOOKING_ENDPOINTS[currentBranch()] || ''; }
  // A branch books online once its own system endpoint is wired up. If a
  // post has already failed to leave this device, the online route is not
  // working for this visitor, so the form falls back to WhatsApp for the
  // rest of the visit rather than swallowing a second booking.
  function useSystem() {
    // Partner surgery consultations are arranged by reception on WhatsApp.
    return serviceSel.value !== 'plastic-surgery' && !postFailed && !!branchEndpoint();
  }

  /* ── What is missing, and how we say so ───────────────────────────────
     One validator per field. Each returns '' when the field is fine, or
     the one short line the patient reads. The two text fields show their
     line under the input; date and time have no text field, so their
     lines appear only in the summary at the top of the form. Nothing
     here touches the submit gating, the payload or the endpoints.
     ------------------------------------------------------------------ */
  function todayStr() {
    var n = new Date();
    return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
  }

  // the first time a patient can still pick on the chosen date
  function firstSlot() {
    return slotsWrap ? slotsWrap.querySelector('#bkPreferredTime, button.slot:not([disabled])') : null;
  }

  function nameProblem() {
    var v = nameInput ? nameInput.value.trim() : '';
    if (!v) return t('Enter your full name.');
    if (v.length < 2) return t('Enter your full name, at least two characters.');
    return '';
  }

  // Only the online route needs a number typed in; the WhatsApp handoff
  // carries the patient's number in the chat itself.
  function phoneProblem() {
    if (!useSystem()) return '';
    var v = phoneInput ? phoneInput.value.trim() : '';
    if (!v) return t('Enter the phone number we should call you on.');
    if (!phoneValid()) return t('Enter at least eight digits of your phone number.');
    return '';
  }

  function dateProblem() {
    var v = dateInput ? dateInput.value : '';
    if (!v) return t('Choose the date you would like to visit.');
    if (v < todayStr()) return t('Choose today or a later date.');
    if (!firstSlot() && !selectedTime) return t('No times are left on that date. Choose another day.');
    return '';
  }

  function timeProblem() {
    if (selectedTime) return '';
    if (dateProblem()) return '';   // the date is what to fix first
    return $('#bkPreferredTime', slotsWrap) ? t('Enter your preferred time. Reception will confirm availability.') : t('Choose one of the times shown.');
  }

  // an inline line under one input, tied to it by the aria-describedby
  // already in the markup; aria-invalid says the same thing to software
  function setFieldError(input, errEl, message) {
    if (errEl) {
      errEl.textContent = message || '';
      if (message) errEl.removeAttribute('hidden');
      else errEl.setAttribute('hidden', '');
    }
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  // A shown line must never outlive its problem, so clear any that the
  // patient has just fixed. This only ever removes a line: a half typed
  // name is not scolded mid word.
  function easeErrors() {
    if (nameInput && nameInput.getAttribute('aria-invalid') === 'true' && !nameProblem()) {
      setFieldError(nameInput, nameErr, '');
    }
    if (phoneInput && phoneInput.getAttribute('aria-invalid') === 'true' && !phoneProblem()) {
      setFieldError(phoneInput, phoneErr, '');
    }
  }

  // every problem the form currently has, in the order the fields appear
  function problems() {
    var list = [];
    var m = nameProblem();
    if (m) list.push({ href: '#bkName', message: m, target: function () { return nameInput; } });
    m = phoneProblem();
    if (m) list.push({ href: '#bkPhone', message: m, target: function () { return phoneInput; } });
    m = dateProblem();
    if (m) list.push({ href: '#bkDate', message: m, target: function () { return dateInput; } });
    m = timeProblem();
    if (m) list.push({ href: '#bkSlots', message: m, target: firstSlot });
    return list;
  }

  function fillSummary(list) {
    if (!summaryList) return;
    summaryList.innerHTML = '';
    list.forEach(function (p) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = p.href;
      a.textContent = p.message;
      on(a, 'click', function (e) {
        e.preventDefault();
        var el = p.target();
        if (el) { try { el.focus(); } catch (err) { /* nothing focusable */ } }
      });
      li.appendChild(a);
      summaryList.appendChild(li);
    });
  }

  function hideSummary() {
    if (summary) summary.setAttribute('hidden', '');
    if (summaryList) summaryList.innerHTML = '';
  }

  // While the summary is up it has to keep telling the truth, so rebuild
  // it from what is missing now and take it away once nothing is.
  function refreshSummary() {
    if (!summary || summary.hasAttribute('hidden')) return;
    var list = problems();
    if (!list.length) { hideSummary(); return; }
    var held = summary.contains(document.activeElement);
    fillSummary(list);
    if (held) { try { summary.focus(); } catch (e) { /* older browser */ } }
  }

  // A blocked Confirm is the one moment the patient needs the whole
  // picture: the inline lines and a summary that takes focus, with a link
  // per problem straight to the control that fixes it.
  function reportBlocked() {
    setFieldError(nameInput, nameErr, nameProblem());
    setFieldError(phoneInput, phoneErr, phoneProblem());
    var list = problems();
    if (!summary || !list.length) return;
    fillSummary(list);
    summary.removeAttribute('hidden');
    try { summary.focus(); } catch (e) { /* older browser */ }
  }

  function update() {
    var branchEl = checked('bkBranch');
    var branch  = branchEl.dataset.name;
    var service = serviceSel.selectedOptions[0].textContent;
    var dateVal = dateInput ? dateInput.value : '';
    var name    = nameInput ? nameInput.value.trim() : '';
    var phone   = phoneInput ? phoneInput.value.trim() : '';
    var online  = useSystem();   // this branch has its system endpoint wired

    if (sum.branch)  sum.branch.textContent  = branch;
    if (sum.name)    sum.name.textContent    = name  || t('Not set');
    if (sum.phone)   sum.phone.textContent   = phone || t('Not set');
    if (sum.service) sum.service.textContent = service;
    if (sum.date)    sum.date.textContent    = prettyDate(dateVal);
    if (sum.time)    sum.time.textContent    = selectedTime ? displayTime(selectedTime) : t('Not set');
    if (sent) return;

    // Online booking needs a phone so reception can call back; the WhatsApp
    // fallback keeps phone optional, since the chat carries the number.
    if (submitLabel) submitLabel.textContent = t(online ? 'Send booking request' : 'Confirm via WhatsApp');
    if (waIcon) waIcon.style.display = online ? 'none' : '';   // no WhatsApp logo on 'Send booking request'
    if (note) note.textContent = sending ? t('Sending your request...') : postFailed ? failureMessage() : online
      ? t('Your request goes to our {branch} reception. They will contact you to confirm availability. There is no online payment.', { branch: branch })
      : t('WhatsApp will open with your appointment details ready to send. Reception will reply to confirm availability. There is no online payment.');

    // whatever just changed, no shown message may still be lying
    easeErrors();
    refreshSummary();

    if (!submit) return;
    var contactPhone = $('#bkPhoneLink');
    if (contactPhone) {
      contactPhone.hidden = online;
      var direct = $('a', contactPhone);
      direct.href = 'tel:' + branchEl.dataset.phone;
      direct.dataset.branch = branchEl.dataset.branch;
      direct.dataset.treatment = serviceSel.selectedOptions[0].dataset.slug || 'consultation';
      direct.textContent = (isArabic() ? 'اتصل بالاستقبال ' : 'Call reception ') + branchEl.dataset.phone;
    }
    // The form marks the name Required and the summary asks for it, so the
    // gate has to agree: a booking with no name is not one reception can act
    // on, and promising a rule we do not enforce is worse than not asking.
    var ready = !!(dateVal && selectedTime && !nameProblem() && (!online || phoneValid()));
    submit.setAttribute('aria-disabled', ready ? 'false' : 'true');

    if (ready && !online) {
      // WhatsApp handoff (New Cairo, or Mohandseen before the sheet is wired)
      var wa = branchEl.dataset.wa;
      var msg = t('Hello! I would like to book an appointment.') + '\n'
              + '• ' + t('Branch') + ': ' + branch + '\n'
              + (name  ? '• ' + t('Name') + ': ' + name + '\n' : '')
              + (phone ? '• ' + t('Phone') + ': ' + phone + '\n' : '')
              + '• ' + t('Treatment') + ': ' + service + '\n'
              + '• ' + t('Date') + ': ' + prettyDate(dateVal) + '\n'
              + '• ' + t('Time') + ': ' + displayTime(selectedTime);
      submit.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
      submit.setAttribute('target', '_blank');
      // a real link again: the browser gives it focus and Enter for free
      submit.removeAttribute('role');
      submit.removeAttribute('tabindex');
    } else {
      // system submit is handled by the click listener; nothing to navigate to
      submit.removeAttribute('href');
      submit.removeAttribute('target');
      // An <a> with no href is neither focusable nor operable by keyboard,
      // so a patient using the keyboard or a screen reader could fill the
      // whole form and never reach Confirm. Make it a button in every sense
      // the markup allows; the keydown listener below supplies Enter and Space.
      submit.setAttribute('role', 'button');
      submit.setAttribute('tabindex', '0');
    }
  }

  // Post a Mohandseen booking to the reception sheet + email. Apps Script
  // web apps answer without CORS headers, so we send 'no-cors' (opaque
  // response) and confirm optimistically; the sheet and email are the
  // record of truth.
  // We cannot READ an opaque response, but we can still tell whether the
  // request left the device: fetch rejects when the network never carried
  // it. So a rejection is never dressed up as a confirmation. Anything
  // else, including a slow network, keeps the optimistic confirmation the
  // page has always shown.
  function confirmSent() {
    if (sent) return;
    sent = true;
    sending = false;
    hideSummary();
    setFieldError(nameInput, nameErr, '');
    setFieldError(phoneInput, phoneErr, '');
    if (note) note.hidden = true;
    if (done) done.hidden = false;
    if (submit) submit.style.display = 'none';
    // Confirm is now display:none, so focus would fall to the top of the
    // page and the confirmation would pass in silence. Put focus on it.
    if (done) {
      if (!done.hasAttribute('tabindex')) done.setAttribute('tabindex', '-1');
      try { done.focus(); } catch (e) { /* older browser */ }
    }
  }

  function failureMessage() {
    return t('We could not reach our booking system. Please try again, or use the WhatsApp button to send your details to reception.');
  }

  function sendFailed() {
    if (sent) return;
    sending = false;
    postFailed = true;             // useSystem() now offers WhatsApp instead
    if (done) done.hidden = true;  // nothing was confirmed, so nothing is claimed
    if (submit) submit.style.display = '';
    update();                      // rebuilds the WhatsApp link, label and note
    if (note) {
      note.hidden = false;
      note.textContent = failureMessage();
      // the request state changed and nothing moved, so say so where the
      // patient is looking rather than repainting a paragraph in silence
      if (!note.hasAttribute('tabindex')) note.setAttribute('tabindex', '-1');
      try { note.focus(); } catch (e) { /* older browser */ }
    }
  }

  function sendToReception() {
    if (sent || sending) return;
    var payload = {
      action:      'saveWebBooking',
      branch:      currentBranch(),
      name:        nameInput ? nameInput.value.trim() : '',
      phone:       phoneInput ? normaliseDigits(phoneInput.value.trim()) : '',
      service:     serviceSel ? serviceSel.value : 'Consultation',
      date:        dateInput ? dateInput.value : '',
      dateText:    prettyDate(dateInput ? dateInput.value : '', true),
      time:        selectedTime,
      source:      'website',
      submittedAt: new Date().toISOString()
    };
    sending = true;
    var settled = false;
    function ok()   { if (settled) return; settled = true; confirmSent(); }
    function fail() { if (settled) return; settled = true; sendFailed(); }

    if (note) { note.hidden = false; note.textContent = t('Sending your request...'); }

    try {
      var post = fetch(branchEndpoint(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (post && post.then) {
        post.then(ok, fail);
        // A slow network is not a failure. If the request is still in the
        // air after a few seconds it has left the device, and the sheet is
        // the record of truth, so confirm rather than hold the patient.
        window.setTimeout(ok, 6000);
      } else { ok(); }
    } catch (e) { fail(); }   // no fetch at all, or it threw before sending
  }

  // pre-select the service passed from a treatment page. A Mohandseen-only
  // treatment (e.g. ?service=veneers) also switches the branch to match.
  try {
    var params = new URLSearchParams(window.location.search);
    var branchParam = params.get('branch');
    var branchInput = $$('input[name=bkBranch]', form).find(function (r) { return r.dataset.branch === branchParam; });
    if (branchInput) branchInput.checked = true;
    var svcSlug = params.get('service');
    if (svcSlug && serviceSel) {
      var opt = Array.from(serviceSel.options).find(function (option) { return option.dataset.slug === svcSlug; });
      if (opt) {
        var branchOnly = opt.getAttribute('data-branch');
        if (branchOnly) {
          var b = form.querySelector('input[name="bkBranch"][value="' + branchOnly + '"]');
          if (b) b.checked = true;
        }
        opt.selected = true;
      }
    }
  } catch (e) { /* URLSearchParams unsupported - defaults stay */ }

  syncServiceOptions();

  $$('input[name="bkBranch"]', form).forEach(function (r) {
    on(r, 'change', function () { syncServiceOptions(); buildSlots(); });
  });
  on(serviceSel, 'change', update);
  on(dateInput, 'change', buildSlots);
  on(nameInput, 'input', update);
  on(phoneInput, 'input', update);
  // Checked when the patient leaves the field, not on every keystroke and
  // not only at the end. Focus never moves on blur: they are on their way
  // to the next field and we do not pull them back.
  on(nameInput, 'blur', function () {
    setFieldError(nameInput, nameErr, nameProblem());
    refreshSummary();
  });
  on(phoneInput, 'blur', function () {
    setFieldError(phoneInput, phoneErr, phoneProblem());
    refreshSummary();
  });

  function activate(e) {
    if (submit.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      reportBlocked();
      return;
    }
    if (sent || sending) { e.preventDefault(); return; }
    measure('booking_submit', checked('bkBranch').dataset.branch, serviceSel.selectedOptions[0].dataset.slug || 'consultation');
    if (useSystem()) {
      e.preventDefault();
      sendToReception();
    }
    // otherwise the <a href="wa.me/…"> opens WhatsApp as before
  }

  on(submit, 'click', activate);
  on(submit, 'keydown', function (e) {
    // Only while it is standing in for a button. With a real href the
    // browser already handles Enter, and Space should scroll as usual.
    if (!submit || submit.hasAttribute('href')) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();   // Space must not scroll the page out from under it
      activate(e);
    }
  });

  var alternate = $('[data-language-link]');
  if (alternate) {
    alternate.search = window.location.search;
    var storageKey = 'soie-booking-handoff';
    try {
      var saved = JSON.parse(sessionStorage.getItem(storageKey));
      sessionStorage.removeItem(storageKey);
      if (saved && saved.path === location.pathname && Date.now() - saved.created < 30000) {
        var radio = $$('input[name=bkBranch]', form).find(function (r) { return r.value === saved.branch; });
        if (radio) radio.checked = true;
        syncServiceOptions();
        serviceSel.value = saved.service;
        nameInput.value = saved.name;
        phoneInput.value = saved.phone;
        dateInput.value = saved.date;
        buildSlots();
        var slot = $$('.slot', slotsWrap).find(function (s) { return s.dataset.time === saved.time; });
        if (slot) slot.click();
        var preferred = $('#bkPreferredTime', slotsWrap);
        if (preferred && saved.preferred) {
          preferred.value = saved.preferred;
          preferred.dispatchEvent(new Event('input'));
        }
      }
    } catch (_) { /* Storage may be disabled. */ }
    on(alternate, 'click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || sent || sending) return;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          path: alternate.pathname, created: Date.now(), branch: currentBranch(), service: serviceSel.value,
          name: nameInput.value, phone: phoneInput.value, date: dateInput.value, time: selectedTime,
          preferred: $('#bkPreferredTime', slotsWrap)?.value || ''
        }));
      } catch (_) { /* Navigation works independently of storage. */ }
    });
  }
  update();
})();
