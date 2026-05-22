export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') {
    return
  }

  const session = useCookie<string | null>('admin_session')

  if (session.value) {
    return
  }

  if (import.meta.client) {
    try {
      await $fetch('/api/auth/me')
      return
    } catch {
      // fall through to login redirect
    }
  }

  if (!session.value) {
    return navigateTo({
      path: '/admin/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
