/**
 * src/technician/utils/maps.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Google Maps directions deep link (SOL-196).
 *
 * Uses the cross-platform Maps URLs format: on Android and iOS it opens the
 * Google Maps app when installed and falls back to the browser otherwise, so
 * no platform-specific scheme (geo:, comgooglemaps://) is needed.
 * https://developers.google.com/maps/documentation/urls/get-started
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * @param {string} address - Free-text site address from jobs.site_address
 * @returns {string|null} Directions URL, or null if there's nothing to route to
 */
export function buildDirectionsUrl(address) {
  const destination = String(address ?? '').trim();
  if (!destination) return null;
  return (
    'https://www.google.com/maps/dir/?api=1' +
    `&destination=${encodeURIComponent(destination)}` +
    '&travelmode=driving'
  );
}
