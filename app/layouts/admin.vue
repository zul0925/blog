<script setup lang="ts">
const route = useRoute()

const navItems = [
  {
    label: '概览',
    shortLabel: '概览',
    to: '/admin',
    exact: true
  },
  {
    label: '文章管理',
    shortLabel: '文章',
    to: '/admin/posts',
    exact: true
  },
  {
    label: '新建文章',
    shortLabel: '新建',
    to: '/admin/posts/new',
    exact: true
  }
]

const isActive = (item: typeof navItems[number]) => {
  if (item.exact) {
    return route.path === item.to
  }

  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

const navLinkClass = (item: typeof navItems[number]) => [
  'rounded-lg px-3 py-2.5 transition',
  isActive(item)
    ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
]

const mobileNavLinkClass = (item: typeof navItems[number]) => [
  'rounded-lg px-3 py-2 transition whitespace-nowrap',
  isActive(item)
    ? 'bg-blue-600 text-white'
    : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
]

const logout = async () => {
  await $fetch('/api/auth/logout', {
    method: 'POST'
  })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <aside class="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
      <div class="flex items-center gap-3 px-3 pb-6">
        <img
          alt="渐晚 logo"
          class="size-11 rounded-lg object-cover shadow-sm"
          src="/logo-jianwan.png"
        >
        <div>
          <strong class="block text-lg">渐晚 Admin</strong>
          <span class="mt-1 block text-sm text-slate-500">内容管理后台</span>
        </div>
      </div>

      <nav class="grid gap-1 text-sm font-semibold" aria-label="后台导航">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="navLinkClass(item)"
          :to="item.to"
        >
          {{ item.label }}
        </NuxtLink>
        <NuxtLink class="rounded-lg px-3 py-2.5 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700" to="/">
          返回前台
        </NuxtLink>
      </nav>

      <div class="mt-auto grid gap-3 border-t border-slate-100 px-3 pt-4 text-sm text-slate-500">
        <span>第一版先完成文章从创建到展示的闭环。</span>
        <button class="h-9 rounded-lg border border-slate-200 font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700" type="button" @click="logout">
          退出登录
        </button>
      </div>
    </aside>

    <div class="border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img alt="渐晚 logo" class="size-8 rounded-lg object-cover" src="/logo-jianwan.png">
          <strong>渐晚 Admin</strong>
        </div>
        <button class="text-sm font-bold text-blue-600" type="button" @click="logout">退出</button>
      </div>
      <nav class="flex gap-2 overflow-x-auto text-sm font-semibold" aria-label="移动端后台导航">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="mobileNavLinkClass(item)"
          :to="item.to"
        >
          {{ item.shortLabel }}
        </NuxtLink>
      </nav>
    </div>

    <main class="min-h-screen px-5 py-6 lg:pl-72 lg:pr-8">
      <slot />
    </main>
  </div>
</template>
