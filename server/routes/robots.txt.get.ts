import type { H3Event } from 'h3'

const resolveSiteUrl = (event: H3Event) => {
  const config = useRuntimeConfig()
  const configuredSiteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')

  if (configuredSiteUrl) {
    return configuredSiteUrl
  }

  const requestUrl = getRequestURL(event)

  return `${requestUrl.protocol}//${requestUrl.host}`
}

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return `User-agent: *
Allow: /

Sitemap: ${resolveSiteUrl(event)}/sitemap.xml
`
})
