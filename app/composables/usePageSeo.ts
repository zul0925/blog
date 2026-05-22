type PageSeoInput = {
  title?: string
  description: string
  path?: string
  type?: 'website' | 'article'
  image?: string
}

const siteName = '渐晚Blog'
const defaultImage = '/logo-jianwan.png'

const resolveSiteUrl = (baseUrl: string, path = '/') => new URL(path, baseUrl).toString()

export const usePageSeo = (input: PageSeoInput) => {
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()
  const configuredSiteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')
  const baseUrl = configuredSiteUrl || `${requestUrl.protocol}//${requestUrl.host}`
  const canonicalUrl = resolveSiteUrl(baseUrl, input.path || '/')
  const imageUrl = resolveSiteUrl(baseUrl, input.image || defaultImage)

  useSeoMeta({
    title: input.title || siteName,
    description: input.description,
    ogTitle: input.title ? `${siteName} - ${input.title}` : siteName,
    ogDescription: input.description,
    ogType: input.type || 'website',
    ogUrl: canonicalUrl,
    ogSiteName: siteName,
    ogImage: imageUrl,
    twitterCard: 'summary_large_image',
    twitterTitle: input.title ? `${siteName} - ${input.title}` : siteName,
    twitterDescription: input.description,
    twitterImage: imageUrl
  })

  useHead({
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl
      }
    ]
  })
}
