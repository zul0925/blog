<script setup lang="ts">
import type { PostsResponse } from '~/types/post'

usePageSeo({
  description: '渐晚是一个记录 Nuxt、Vue、数据库、后台系统和个人项目实践的技术博客。',
  path: '/'
})

const { data: postsResponse, pending } = await useAsyncData('home-posts', () =>
  $fetch<PostsResponse>('/api/posts', {
    query: {
      status: 'published',
      limit: 3
    }
  })
)

const posts = computed(() => postsResponse.value?.data ?? [])
const featuredPost = computed(() => posts.value[0])
const latestPosts = computed(() => posts.value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value))
</script>

<template>
  <main>
    <section class="relative overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      <div class="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <p class="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300">
            Nuxt Fullstack Blog
          </p>
          <h1 class="max-w-3xl text-4xl font-bold leading-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            记录全栈开发里的清晰思考与可复用实践
          </h1>
          <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            围绕 Nuxt、Vue、数据库、后台系统和个人项目建设，沉淀能被长期维护的技术文章。
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700" to="/posts">
              浏览文章
            </NuxtLink>
          </div>
        </div>

        <div v-if="pending" class="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          正在加载最新文章...
        </div>

        <NuxtLink
          v-else-if="featuredPost"
          class="group rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 dark:hover:border-blue-900"
          :to="`/posts/${featuredPost.slug}`"
        >
          <div class="mb-10 flex items-center justify-between">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Featured
            </span>
            <span class="text-sm text-slate-500 dark:text-slate-400">{{ formatDate(featuredPost.updatedAt) }}</span>
          </div>
          <p class="text-sm font-bold text-blue-600 dark:text-blue-300">Published</p>
          <h2 class="mt-3 text-2xl font-bold leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
            {{ featuredPost.title }}
          </h2>
          <p class="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            {{ featuredPost.excerpt || '这篇文章暂时没有摘要。' }}
          </p>
        </NuxtLink>

        <div v-else class="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          还没有已发布文章。登录后台新建并发布第一篇文章后，这里会自动展示。
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-14">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <p class="text-sm font-bold text-blue-600 dark:text-blue-300">Latest Notes</p>
          <h2 class="mt-2 text-2xl font-bold text-slate-950 dark:text-white">最近更新</h2>
        </div>
        <NuxtLink class="text-sm font-bold text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300" to="/posts">
          查看全部
        </NuxtLink>
      </div>

      <div v-if="latestPosts.length" class="grid gap-4 md:grid-cols-2">
        <NuxtLink
          v-for="post in latestPosts"
          :key="post.slug"
          class="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:shadow-black/20"
          :to="`/posts/${post.slug}`"
        >
          <div class="mb-4 flex items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>Published</span>
            <span>{{ formatDate(post.updatedAt) }}</span>
          </div>
          <h3 class="text-xl font-bold text-slate-950 dark:text-white">{{ post.title }}</h3>
          <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">{{ post.excerpt || '这篇文章暂时没有摘要。' }}</p>
        </NuxtLink>
      </div>

      <p v-else class="rounded-lg border border-slate-200 bg-white p-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        暂无更多文章。
      </p>
    </section>
  </main>
</template>
