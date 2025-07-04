"use strict";

function sanitizeString(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitize the value only if it is a non-empty string. Otherwise return
 * the value unchanged so objects like image payloads remain intact.
 * @param {*} value
 * @returns {*}
 */
function sanitizeIfString(value) {
  return typeof value === "string" ? sanitizeString(value) : value;
}

module.exports = { sanitizeString, sanitizeIfString };
