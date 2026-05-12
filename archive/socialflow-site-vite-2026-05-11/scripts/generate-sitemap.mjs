// Post-build: generate sitemap.xml from built HTML files.
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://socialflow-olive.vercel.app'
const dist = 'dist/web'
const today = new Date().toISOString().split('T')[0]

const urls = []

// Root redirector
urls.push({ loc: '/', priority: '1.0', changefreq: 'monthly' })

// FR + EN pages
for (const lang of ['fr', 'en']) {
  const dir = join(dist, lang)
  const files = readdirSync(dir).filter(f => f.endsWith('.html'))
  for (const file of files) {
    const path = `/${lang}/${file}`
    const isIndex = file === 'index.html'
    urls.push({
      loc: path,
      priority: isIndex ? '0.9' : '0.7',
      changefreq: 'monthly',
    })
  }
}

// Demo
urls.push({ loc: '/demo.html', priority: '0.6', changefreq: 'monthly' })

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(u => {
    // Add hreflang alternates for FR/EN pairs
    const match = u.loc.match(/^\/(fr|en)\/(.+)$/)
    const alternates = match
      ? `
    <xhtml:link rel="alternate" hreflang="fr" href="${SITE}/fr/${match[2]}" />
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/en/${match[2]}" />`
      : ''
    return `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${alternates}
  </url>`
  })
  .join('\n')}
</urlset>
`

writeFileSync(join(dist, 'sitemap.xml'), xml)
console.info(`Sitemap generated: ${urls.length} URLs.`)
