// Post-build: inject hreflang + canonical into built HTML files.
// Vite treats <link href> as assets and hashes the URLs, so we add them after build.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist/web'
const langs = ['fr', 'en']

for (const lang of langs) {
  const dir = join(dist, lang)
  const files = readdirSync(dir).filter(f => f.endsWith('.html'))

  for (const file of files) {
    const filePath = join(dir, file)
    let html = readFileSync(filePath, 'utf-8')

    const tags = [
      `<link rel="alternate" hreflang="fr" href="/fr/${file}" />`,
      `<link rel="alternate" hreflang="en" href="/en/${file}" />`,
      `<link rel="canonical" href="/${lang}/${file}" />`,
    ].join('\n    ')

    html = html.replace('</head>', `    ${tags}\n  </head>`)
    writeFileSync(filePath, html)
  }
}

console.info('SEO tags injected.')
