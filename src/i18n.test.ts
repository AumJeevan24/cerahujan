import { describe, expect, it } from 'vitest'
import { detectLang, initialLang, t } from './i18n'

describe('detectLang', () => {
  it('picks BM for Malay browser languages', () => {
    expect(detectLang(['ms-MY', 'en'])).toBe('ms')
    expect(detectLang(['ms'])).toBe('ms')
    expect(detectLang(['MS-my'])).toBe('ms')
  })

  it('picks English for everything else', () => {
    expect(detectLang(['en-MY', 'ms'])).toBe('en')
    expect(detectLang(['zh-CN'])).toBe('en')
    expect(detectLang([])).toBe('en')
  })
})

describe('initialLang', () => {
  it('uses a saved choice first', () => {
    expect(initialLang('en', ['ms-MY'])).toBe('en')
    expect(initialLang('ms', ['en-GB'])).toBe('ms')
  })

  it('ignores invalid saved values', () => {
    expect(initialLang('fr', ['ms-MY'])).toBe('ms')
    expect(initialLang(null, ['en-US'])).toBe('en')
  })
})

describe('t', () => {
  it('returns text in the requested language', () => {
    expect(t('tagline', 'ms')).toContain('Malaysia')
    expect(t('tagline', 'en')).toBe('Weather, heat, storms and haze for Malaysia.')
  })
})
