type PageSeoInput = {
  title: string
  description: string
  path?: string
  type?: 'website' | 'article'
  image?: string
}

const siteName = '渐晚'
const defaultImage = '/logo-jianwan.png'

const resolveSiteUrl = (path = '/') => {
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()
  const configuredSiteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')
  const baseUrl = configuredSiteUrl || `${requestUrl.protocol}//${requestUrl.host}`

  return new URL(path, baseUrl).toString()
}

export const usePageSeo = (input: PageSeoInput) => {
  const canonicalUrl = computed(() => resolveSiteUrl(input.path || '/'))
  const imageUrl = computed(() => resolveSiteUrl(input.image || defaultImage))

  useSeoMeta({
    title: input.title,
    description: input.description,
    ogTitle: input.title,
    ogDescription: input.description,
    ogType: input.type || 'website',
    ogUrl: canonicalUrl,
    ogSiteName: siteName,
    ogImage: imageUrl,
    twitterCard: 'summary_large_image',
    twitterTitle: input.title,
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
