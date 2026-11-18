// Extracts _('...') calls from src/**/*.ts into locales/plantuml.pot.
// Usage: npm run i18n:extract
// After updating the POT, merge it into each PO file (e.g. with `msgmerge -U locales/ja.po locales/plantuml.pot`
// or Poedit "Update from POT file").

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const { po } = require('gettext-parser')

const rootDir = path.resolve(__dirname, '..')
const potFile = path.join(rootDir, 'locales', 'plantuml.pot')
const callRegExp = /\b_\(\s*'((?:[^'\\]|\\.)*)'/g

const entries = {}
const files = glob.sync('src/**/*.ts', { cwd: rootDir, ignore: ['src/locales.generated.ts'] }).sort()

for (const file of files) {
    const lines = fs.readFileSync(path.join(rootDir, file), 'utf8').split(/\r?\n/)
    lines.forEach((line, index) => {
        let match
        while ((match = callRegExp.exec(line)) !== null) {
            const msgid = match[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\')
            const reference = `${file}:${index + 1}`
            if (!entries[msgid]) {
                entries[msgid] = { msgid, msgstr: [''], comments: { reference: reference } }
                if (msgid.includes('%s')) entries[msgid].comments.flag = 'c-format'
            } else {
                entries[msgid].comments.reference += '\n' + reference
            }
        }
    })
}

const data = {
    charset: 'utf-8',
    headers: {
        'Project-Id-Version': 'joplin-plugin-plantuml2-i18n',
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit',
    },
    translations: { '': entries },
}

fs.writeFileSync(potFile, po.compile(data, { foldLength: 0 }))
console.info(`[i18n] Extracted ${Object.keys(entries).length} strings to ${path.relative(rootDir, potFile)}`)
