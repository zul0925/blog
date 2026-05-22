import { listPosts } from '../services/post.service'
import type { H3Event } from 'h3'

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const resolveSiteUrl = (event: H3Event) => {
  const config = useRuntimeConfig()
  const configuredSiteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')

  if (configuredSiteUrl) {
    return configuredSiteUrl
  }

  const requestUrl = getRequestURL(event)

  return `${requestUrl.protocol}//${requestUrl.host}`
}

export default defineEventHandler(async (event) => {
  const siteUrl = resolveSiteUrl(event)
  const { data: posts } = await listPosts({
    status: 'published',
    limit: 100,
    offset: 0
  })
  const staticRoutes = [
    {
      loc: '/',
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: '/posts',
      changefreq: 'daily',
      priority: '0.8'
    }
  ]
  const postRoutes = posts.map((post) => ({
    loc: `/posts/${post.slug}`,
    lastmod: new Date(post.updatedAt).toISOString(),
    changefreq: 'weekly',
    priority: '0.7'
  }))
  const urls = [...staticRoutes, ...postRoutes]
    .map((route) => {
      const loc = `${siteUrl}${route.loc}`
      const lastmod = 'lastmod' in route ? `\n    <lastmod>${route.lastmod}</lastmod>` : ''

      return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    })
    .join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
})
