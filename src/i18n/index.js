/**
 * src/i18n/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * i18n architecture setup (SOL-157-adjacent, Epic 6 item 10) — English /
 * Sinhala / Tamil, no user-visible change yet. This is the enabler that items
 * 11, 12 and 17 (string extraction) and 18/19 (translation passes) build on.
 *
 * Resources are the three JSON files in ./locales, loaded eagerly and passed
 * to i18next inline — small enough that a lazy-loading backend plugin isn't
 * worth the extra complexity yet. Revisit if the translated files grow large.
 *
 * Key convention: namespaced by screen/module, e.g. `admin.dashboard.title`,
 * `auth.login.submitButton`. Nested JSON objects (not flat dot-keys) — i18next
 * resolves the dots via its default `keySeparator`, so `t('admin.dashboard.title')`
 * walks down through `{ admin: { dashboard: { title: ... } } }`.
 *
 * Fallback behavior (both from i18next defaults, no extra config needed):
 *   - Unsupported device locale → English (`fallbackLng`).
 *   - A key missing from every loaded language → i18next returns the key
 *     string itself, so an unextracted string is obviously wrong in dev
 *     rather than silently blank.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

export const SUPPORTED_LANGUAGES = ['en', 'si', 'ta'];
const DEFAULT_LANGUAGE = 'en';

/**
 * What language the app boots into, today: whatever the device is set to, if
 * we support it, else English.
 *
 * Item 20 (Language Switcher UI) will check AsyncStorage for a saved
 * `app_locale` preference and call `i18n.changeLanguage()` with it *before*
 * this ever matters, per its own boot-sequence spec (saved preference →
 * device locale → English) — this function is deliberately just the second
 * and third steps of that chain, so item 20 only has to add a check in front
 * of it rather than rewire this file.
 */
function detectDeviceLanguage() {
  const [primary] = getLocales();
  const code = primary?.languageCode;
  return SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si },
    ta: { translation: ta },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false, // React already escapes output — double-escaping would corrupt entities.
  },
  returnEmptyString: false,
});

export default i18n;
