/* Shared English / Arabic UI. English HTML remains the default and no-JS fallback.
   The dictionary translates text nodes, never markup, URLs or form values.
   Dynamic components use SoieI18n.t() and listen for soie:languagechange. */
(function () {
  'use strict';
  var root = document.documentElement;
  var dictionary = window.SoieArabic || {};
  var language = root.lang === 'ar' ? 'ar' : 'en';
  var records = [];
  var schemas = [];
  var skip = 'script, style, svg, noscript, [data-i18n-ignore], [data-i18n-live], [translate="no"]';

  function normalise(value) { return value.replace(/\s+/g, ' ').trim(); }
  function t(value, variables) {
    var result = language === 'ar' && Object.prototype.hasOwnProperty.call(dictionary, value)
      ? dictionary[value] : value;
    return result.replace(/\{(\w+)\}/g, function (match, key) {
      return variables && Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
    });
  }
  function time(value) {
    return language === 'ar' ? value.replace(/AM/g, 'صباحًا').replace(/PM/g, 'مساءً') : value;
  }
  function capture(node, attribute) {
    var english = attribute ? node.getAttribute(attribute) : node.nodeValue;
    var key = normalise(english);
    if (!Object.prototype.hasOwnProperty.call(dictionary, key)) return;
    var arabic = english.replace(/\S[\s\S]*\S|\S/, dictionary[key]);
    records.push({ node: node, attribute: attribute, en: english, ar: arabic });
  }

  var walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  var node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && !node.parentElement.closest(skip)) capture(node);
  }
  document.querySelectorAll('[alt], [aria-label], [placeholder], [title]').forEach(function (el) {
    if (el.closest(skip)) return;
    ['alt', 'aria-label', 'placeholder', 'title'].forEach(function (attr) {
      if (el.hasAttribute(attr)) capture(el, attr);
    });
  });
  document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]').forEach(function (el) {
    capture(el, 'content');
  });
  document.querySelectorAll('script[type="application/ld+json"]').forEach(function (el) {
    try { schemas.push({ node: el, data: JSON.parse(el.textContent) }); }
    catch (e) { /* Leave invalid external data untouched. */ }
  });
  function localiseSchema(value, key) {
    if (typeof value === 'string') return /^(name|description|text)$/.test(key) ? t(value) : value;
    if (Array.isArray(value)) return value.map(function (item) { return localiseSchema(item, key); });
    if (!value || typeof value !== 'object') return value;
    var result = {};
    Object.keys(value).forEach(function (k) { result[k] = localiseSchema(value[k], k); });
    return result;
  }

  function render() {
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    records.forEach(function (record) {
      if (!record.node.isConnected) return;
      if (record.attribute) record.node.setAttribute(record.attribute, record[language]);
      else record.node.nodeValue = record[language];
    });
    schemas.forEach(function (schema) {
      schema.node.textContent = JSON.stringify(localiseSchema(schema.data, ''));
    });
    document.querySelectorAll('[data-language]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    document.querySelectorAll('.language-switch').forEach(function (group) {
      group.setAttribute('aria-label', t('Website language'));
    });
  }
  function setLanguage(value) {
    if (value !== 'en' && value !== 'ar') return;
    language = value;
    try { localStorage.setItem('soie-language', value); } catch (e) { /* Preference lasts for this page. */ }
    render();
    document.dispatchEvent(new CustomEvent('soie:languagechange', { detail: { language: value } }));
    // The header shows the other language. Keep keyboard focus on that control
    // after the button used to switch becomes hidden.
    if (document.activeElement && document.activeElement.hasAttribute('data-language')) {
      var next = document.querySelector('[data-language="' + (language === 'en' ? 'ar' : 'en') + '"]');
      if (next) next.focus({ preventScroll: true });
    }
  }
  window.SoieI18n = {
    t: t, time: time,
    language: function () { return language; },
    setLanguage: setLanguage
  };
  document.querySelectorAll('[data-language]').forEach(function (button) {
    button.addEventListener('click', function () { setLanguage(button.dataset.language); });
  });
  render();
}());
