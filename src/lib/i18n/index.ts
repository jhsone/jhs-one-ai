import { en } from './en'
import { bn } from './bn'

type DeepValue<T, K extends string> = K extends keyof T
  ? T[K]
  : K extends `${infer K1}.${infer K2}`
    ? K1 extends keyof T
      ? DeepValue<T[K1], K2>
      : string
    : string

const translations = { en, bn } as const
type Lang = keyof typeof translations

let currentLang: Lang = 'en'

export function setLanguage(lang: 'en' | 'bn') {
  currentLang = lang
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en'
  }
}

export function getCurrentLanguage(): Lang {
  return currentLang
}

export function t(path: string): string {
  const keys = path.split('.')
  let result: any = translations[currentLang]

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      const fallback: any = translations['en']
      let fb = fallback
      for (const k of keys) {
        if (fb && typeof fb === 'object' && k in fb) {
          fb = fb[k]
        } else {
          return path
        }
      }
      return typeof fb === 'string' ? fb : path
    }
  }

  return typeof result === 'string' ? result : path
}

export { en, bn }
