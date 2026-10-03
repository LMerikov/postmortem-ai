import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'

const STORAGE_KEY = 'pm-lang'

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {}
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
}

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: initialLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try { localStorage.setItem(STORAGE_KEY, lng) } catch {}
})

export default i18n
