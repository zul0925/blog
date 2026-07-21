import { listPosts } from '../services/post.service'
import { renderMarkdownPlain } from '../utils/markdown'
import type { H3Event } from 'h3'

const SITE_TITLE = '渐晚Blog'
const SITE_DESCRIPTION = '围绕 Nuxt、Vue、数据库、后台系统和个人项目建设，沉淀能被长期维护的技术文章。'

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

// CDATA 内若出现 ]]> 会导致解析提前结束，按标准方式拆分转义。
const cdataSafe = (value: string) => value.replaceAll(']]>', ']]]]><![CDATA[>')

export default defineEventHandler(async (event) => {
  const siteUrl = resolveSiteUrl(event)
  const { data: posts } = await listPosts({
    status: 'published',
    limit: 50,
    offset: 0
  })

  const lastBuildDate = posts[0]?.updatedAt
    ? new Date(posts[0].updatedAt).toUTCString()
    : new Date().toUTCString()

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/posts/${post.slug}`
      const pubDate = new Date(post.updatedAt).toUTCString()
      const description = post.excerpt || post.title
      const content = cdataSafe(renderMarkdownPlain(post.content))

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
    </item>`
    })
    .join('\n')

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
})
