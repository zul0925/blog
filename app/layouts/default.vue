<script setup lang="ts">
const isDark = ref(false)

const applyTheme = (value: boolean) => {
  document.documentElement.classList.toggle('dark', value)
  localStorage.setItem('theme', value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme
    ? savedTheme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(isDark.value)
})

watch(isDark, (value) => {
  if (import.meta.client) {
    applyTheme(value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-50">
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <NuxtLink class="flex items-center gap-3" to="/">
          <img
            alt="渐晚 logo"
            class="size-10 rounded-lg object-cover shadow-sm shadow-blue-600/20"
            src="/logo-jianwan.png"
          >
          <span>
            <strong class="block text-sm leading-4">渐晚</strong>
            <span class="block text-xs text-slate-500 dark:text-slate-400">Tech Notes</span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex">
          <NuxtLink class="rounded-lg px-3 py-2 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-900" to="/">
            首页
          </NuxtLink>
          <NuxtLink class="rounded-lg px-3 py-2 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-900" to="/posts">
            文章
          </NuxtLink>
        </nav>

        <button
          class="inline-flex h-10 min-w-16 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900"
          type="button"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="isDark = !isDark"
        >
          {{ isDark ? 'Light' : 'Dark' }}
        </button>
      </div>
    </header>

    <slot />

    <footer class="border-t border-slate-200 bg-white/60 py-8 dark:border-slate-800 dark:bg-slate-950">
      <div class="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 渐晚. Built with Nuxt.</span>
        <span>持续记录工程、产品和全栈开发实践。</span>
      </div>
    </footer>
  </div>
</template>
