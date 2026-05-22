<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const username = ref('')
const password = ref('')
const errorMessage = ref('')

const login = async () => {
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    await navigateTo(redirect)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
  }
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-950 px-5 py-10 text-slate-50">
    <section class="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30">
      <div class="mb-8">
        <img
          alt="渐晚 logo"
          class="mb-5 size-16 rounded-xl object-cover shadow-lg shadow-blue-950/50"
          src="/logo-jianwan.png"
        >
        <p class="text-sm font-bold text-blue-300">渐晚 Admin</p>
        <h1 class="mt-3 text-3xl font-bold">登录后台</h1>
        <p class="mt-3 leading-7 text-slate-400">
          请输入管理员账号，进入渐晚的文章管理和内容维护界面。
        </p>
      </div>

      <form class="grid gap-4" @submit.prevent="login">
        <label class="grid gap-2 text-sm font-bold text-slate-200">
          账号
          <input
            v-model="username"
            class="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 font-normal text-slate-50 outline-none focus:border-blue-400"
            autocomplete="username"
            placeholder="admin"
          >
        </label>

        <label class="grid gap-2 text-sm font-bold text-slate-200">
          密码
          <input
            v-model="password"
            class="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 font-normal text-slate-50 outline-none focus:border-blue-400"
            autocomplete="current-password"
            placeholder="请输入密码"
            type="password"
          >
        </label>

        <p v-if="errorMessage" class="rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {{ errorMessage }}
        </p>

        <button class="mt-2 h-11 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700" type="submit">
          登录
        </button>
      </form>
    </section>
  </main>
</template>
