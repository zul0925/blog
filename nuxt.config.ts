// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-CN'
      },
      titleTemplate: (title) => title ? `渐晚Blog - ${title}` : '渐晚Blog',
      meta: [
        { name: 'theme-color', content: '#2563eb' },
        { name: 'robots', content: 'index, follow' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo-jianwan.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/logo-jianwan.png' },
        { rel: 'apple-touch-icon', href: '/logo-jianwan.png' }
      ]
    }
  },
  runtimeConfig: {
    databaseUrl: '',
    adminUsername: 'admin',
    adminPassword: 'blog2026',
    adminSessionSecret: '',
    public: {
      siteUrl: ''
    }
  }
})
