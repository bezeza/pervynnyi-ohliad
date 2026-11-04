// ==UserScript==
// @name         H24 комфорт (комп’ютер)
// @namespace    github.com/bezeza/pervynnyi-ohliad
// @version      1.0.0
// @description  Той самий спокійніший вигляд МІС Health24, що й стиль Stylus: шрифт 15px, вкладки медкарти, таблиці. Нічого не ховає. Для тих, у кого немає Stylus.
// @author       bezeza
// @license      AGPL-3.0-only
// @match        https://mis.h24.ua/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

/* Той самий CSS, що в h24-comfort.user.css (всередині @-moz-document). Лише <style>, без запитів і без змін сторінки. */
(function () {
  'use strict';
  var css = `  /* Лише вигляд на широкому екрані. Нічого не прибирається: довгі фільтри й ряд вкладок лишаються прокручуваними. */
  @media (min-width: 1100px) {
    html {
      font-size: 15px !important;
    }
    body {
      font-size: 15px !important;
      line-height: 1.45 !important;
    }
    button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], .appBtn,
    a[href*="/medical-card/"]:not(:has([data-test="patientFullName"])) {
      min-height: 36px !important;
      padding: 6px 10px !important;
      font-size: 14.5px !important;
      line-height: 1.35 !important;
      box-sizing: border-box !important;
    }
    input:not([type="checkbox"]):not([type="radio"]), select, textarea {
      font-size: 15px !important;
      line-height: 1.4 !important;
      min-height: 34px !important;
    }
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid #2f6284 !important;
      outline-offset: 2px !important;
    }

    [class*="patient-item"], [class*="info-patient"], [class*="patient-card"], h24-patient-short-info {
      font-size: 15px !important;
      line-height: 1.4 !important;
      padding: 8px 12px !important;
      margin: 0 0 8px !important;
      max-height: none !important;
      border: 1px solid #d5dee6 !important;
      border-radius: 8px !important;
      background: #fff !important;
      color: #1c2830 !important;
    }
    [data-test="patientFullName"], .patient_title, .patient_title span {
      font-size: 18px !important;
      font-weight: 600 !important;
      line-height: 1.3 !important;
      color: #1c2830 !important;
    }
    a[href*="/medical-card/"]:has([data-test="patientFullName"]) {
      background: transparent !important;
      border: 0 !important;
      color: inherit !important;
      padding: 0 !important;
      min-height: 0 !important;
      font-weight: 600 !important;
    }
    [class*="patient-item"] a, [class*="info-patient"] a {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 36px !important;
      margin: 2px 6px 2px 0 !important;
    }

    :is(nav, [role="tablist"], [class*="tabs"], [class*="tab-"], [class*="-tabs"]):has(a[href*="/medical-card/"]),
    :is(ul, ol, div, nav):has(> a[href*="/medical-card/"] ~ a[href*="/medical-card/"]),
    :is(ul, ol):has(> li > a[href*="/medical-card/"]) {
      display: flex !important;
      flex-wrap: wrap !important;
      align-content: flex-start !important;
      align-items: center !important;
      gap: 6px !important;
      max-width: 100% !important;
      max-height: 8.5rem !important;
      overflow: auto !important;
      padding: 6px !important;
      background: #eef2f5 !important;
      border: 1px solid #d5dee6 !important;
      border-radius: 8px !important;
    }
    a[href*="/medical-card/"]:not(:has([data-test="patientFullName"])) {
      display: inline-flex !important;
      align-items: center !important;
      text-decoration: none !important;
      background: #fff !important;
      color: #243744 !important;
      border: 1px solid #d5dee6 !important;
      border-radius: 6px !important;
      white-space: nowrap !important;
    }
    a[href*="/medical-card/patient-summary"],
    a[href*="/medical-card/histories"],
    a[href*="/medical-card/diagnosis"],
    a[href*="/medical-card/documents"],
    a[href*="/medical-card/med-reports"] {
      background: #2f6284 !important;
      color: #fff !important;
      border-color: #2f6284 !important;
      font-weight: 700 !important;
    }
    .patient_title a,
    a[href*="/medical-card/"]:has([data-test="patientFullName"]) {
      background: transparent !important;
      color: #1c2830 !important;
      border: 0 !important;
      padding: 0 !important;
      min-height: 0 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      border-radius: 0 !important;
    }
    [class*="key-value"] {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 4px 10px !important;
      align-items: baseline !important;
      margin: 6px 0 !important;
      font-size: 15px !important;
      line-height: 1.45 !important;
    }

    [class*="h24-filter"], [class*="filters"], form[class*="filter"], aside [class*="filter"] {
      max-height: 38vh !important;
      overflow: auto !important;
      padding: 8px 10px !important;
      background: #f4f6f8 !important;
      color: #3d4c58 !important;
      border: 1px solid #e1e7ec !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
    }
    [class*="h24-filter"] label, [class*="filters"] label, form[class*="filter"] label {
      font-size: 14px !important;
      font-weight: 400 !important;
      color: #3d4c58 !important;
    }

    table {
      border-collapse: separate !important;
      border-spacing: 0 !important;
      font-size: 14.5px !important;
      line-height: 1.4 !important;
      background: #fff !important;
    }
    table td, table th {
      padding: 7px 8px !important;
      line-height: 1.4 !important;
      border-bottom: 1px solid #e3eaef !important;
      vertical-align: top !important;
    }
    table tbody tr:nth-child(even),
    table:not(:has(thead)) tr:nth-child(even):not(:first-child) {
      background: #f3f7fa !important;
    }
    table thead th, table thead td, table th,
    table:not(:has(thead)) tr:first-child > td,
    table:not(:has(thead)) tr:first-child > th {
      position: sticky !important;
      top: 0 !important;
      z-index: 2 !important;
      background: #e5eef3 !important;
      color: #1c2830 !important;
      font-weight: 600 !important;
    }

    [class*="sticky"][class*="bottom"], [class*="action-bar"], [class*="bottom-bar"] {
      background: #f7f8fa !important;
      box-shadow: 0 -1px 0 #d5dee6 !important;
    }
  }`;
  var el = document.createElement('style');
  el.id = 'h24-comfort-style';
  el.textContent = css;
  (document.head || document.documentElement).appendChild(el);
})();
