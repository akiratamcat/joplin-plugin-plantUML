import joplin from 'api'
// Generated from locales/*.po by scripts/compile-po.js (run automatically by `npm run dist`).
import translations from './locales.generated'

type Catalog = { [msgid: string]: string }

const DefaultLocale = 'en'

let currentLocale = DefaultLocale
let catalog: Catalog = {}

/**
 * Find the best matching catalog for a Joplin locale (e.g. "ja_JP", "zh_TW", "pt_BR").
 * Order: exact match -> language part only -> null (fallback to source strings / English).
 */
export function resolveLocale(locale: string, available: string[]): string | null {
    if (!locale) return null
    const normalized = locale.replace('-', '_')
    if (available.includes(normalized)) return normalized
    // Hong Kong / Macau use Traditional Chinese
    if (/^zh_(HK|MO|Hant)/i.test(normalized) && available.includes('zh_TW')) return 'zh_TW'
    if (/^zh_(SG|Hans)/i.test(normalized) && available.includes('zh_CN')) return 'zh_CN'
    const language = normalized.split('_')[0]
    if (available.includes(language)) return language
    // e.g. "zh_HK" -> "zh_TW" when only regional variants exist
    const sameLanguage = available.find(l => l.split('_')[0] === language)
    return sameLanguage || null
}

/**
 * Must be called once at plugin start, before any UI string is registered.
 */
export async function initI18n(): Promise<void> {
    let locale = DefaultLocale
    try {
        locale = await joplin.settings.globalValue('locale')
    } catch (e) {
        console.warn('PlantUML i18n: could not read Joplin locale, falling back to English', e)
    }
    const resolved = resolveLocale(locale, Object.keys(translations))
    currentLocale = resolved || DefaultLocale
    catalog = resolved ? translations[resolved] : {}
}

export function getLocale(): string {
    return currentLocale
}

/**
 * gettext-style lookup. "%s" placeholders are replaced in order by `args`.
 */
export function _(msgid: string, ...args: any[]): string {
    const text = catalog[msgid] || msgid
    let i = 0
    return text.replace(/%s/g, () => (i < args.length ? String(args[i++]) : '%s'))
}
