/**
 * src/i18n/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * i18n architecture setup (SOL-157-adjacent, Epic 6 item 10) — English /
 * Sinhala / Tamil. This is the enabler that items 11, 12 and 17 (string
 * extraction), 18/19 (translation passes) and 20 (Language Switcher UI)
 * build on.
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
 * Boot sequence for which language the app opens in: saved preference →
 * device locale → English. `init()` below handles the last two steps
 * synchronously (so app boot never blocks on an async read); the saved
 * preference, if any, is applied right after via a one-off AsyncStorage read.
 * A returning user may see one frame of the device-locale guess before that
 * resolves — normal, and over within a tick.
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
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';

export const SUPPORTED_LANGUAGES = ['en', 'si', 'ta'];
const DEFAULT_LANGUAGE = 'en';
const LOCALE_STORAGE_KEY = 'app_locale';

/** Device-locale guess, used only until a saved preference (if any) loads. */
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

// A saved preference from a previous session wins over the device-locale
// guess above, once this resolves (AsyncStorage is inherently async, so it
// can't be part of the synchronous init() call).
AsyncStorage.getItem(LOCALE_STORAGE_KEY)
  .then((saved) => {
    if (saved && SUPPORTED_LANGUAGES.includes(saved) && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  })
  .catch(() => {});

/** Switches the active language and remembers the choice for next launch. */
export async function setAppLanguage(code) {
  if (!SUPPORTED_LANGUAGES.includes(code)) return;
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, code).catch(() => {});
}

export default i18n;
