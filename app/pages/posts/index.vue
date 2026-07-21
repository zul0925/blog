<script setup lang="ts">
import type { PostsResponse } from '~/types/post'

const route = useRoute()
const router = useRouter()

usePageSeo({
  title: '技术文章',
  description: '浏览渐晚发布的 Nuxt 全栈、数据库建模、后台系统和个人项目建设文章。',
  path: '/posts'
})

const pageSize = 6
const page = ref(1)
const keyword = ref(String(route.query.q || ''))
const activeTag = computed(() => String(route.query.tag || ''))

watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  }
)

watch([keyword, activeTag], () => {
  page.value = 1
})

const query = computed(() => ({
  status: 'published',
  limit: pageSize,
  offset: (page.value - 1) * pageSize,
  ...(keyword.value ? { q: keyword.value } : {}),
  ...(activeTag.value ? { tag: activeTag.value } : {})
}))

const { data: postsResponse, pending } = await useAsyncData(
  'published-posts',
  () => $fetch<PostsResponse>('/api/posts', { query: query.value }),
  {
    watch: [query]
  }
)

const posts = computed(() => postsResponse.value?.data ?? [])
const pagination = computed(() => postsResponse.value?.pagination)

const submitSearch = async () => {
  await router.push({
    path: '/posts',
    query: {
      ...(keyword.value ? { q: keyword.value } : {}),
      ...(activeTag.value ? { tag: activeTag.value } : {})
    }
  })
}

const clearFilters = async () => {
  keyword.value = ''
  page.value = 1
  await router.push('/posts')
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value))
</script>

<template>
  <main>
    <section class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-5 py-14">
        <p class="text-sm font-bold text-blue-600 dark:text-blue-300">Articles</p>
        <h1 class="mt-3 text-4xl font-bold text-slate-950 dark:text-white">技术文章</h1>
        <p class="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          聚焦 Nuxt 全栈、数据库建模、后台系统和个人项目建设。
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-6xl gap-4 px-5 py-12">
      <form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_auto]" @submit.prevent="submitSearch">
        <label class="relative block">
          <span class="sr-only">搜索文章</span>
          <UIcon class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" name="i-lucide-search" />
          <input
            v-model="keyword"
            class="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="搜索标题、摘要或正文"
            type="search"
          >
        </label>
        <div class="flex gap-2">
          <button class="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700" type="submit">
            搜索
          </button>
          <button v-if="keyword || activeTag" class="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300" type="button" @click="clearFilters">
            清除
          </button>
        </div>
        <p v-if="activeTag" class="text-sm text-slate-500 dark:text-slate-400 sm:col-span-2">
          当前标签：<span class="font-bold text-blue-600 dark:text-blue-300">{{ activeTag }}</span>
        </p>
      </form>

      <p v-if="pending" class="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        正在加载文章...
      </p>

      <NuxtLink
        v-for="post in posts"
        v-else
        :key="post.slug"
        class="group rounded-lg border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:shadow-black/20"
        :to="`/posts/${post.slug}`"
      >
        <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div class="max-w-3xl">
            <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span class="font-semibold text-blue-600 dark:text-blue-300">Published</span>
              <span>{{ post.isOriginal ? '原创' : '转载' }}</span>
              <span>{{ formatDate(post.updatedAt) }}</span>
            </div>
            <h2 class="mt-3 text-2xl font-bold text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
              {{ post.title }}
            </h2>
            <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">
              {{ post.excerpt || '这篇文章暂时没有摘要。' }}
            </p>
            <div v-if="post.tags.length" class="mt-4 flex flex-wrap gap-2">
              <NuxtLink
                v-for="tag in post.tags"
                :key="tag"
                class="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                :to="`/posts?tag=${encodeURIComponent(tag)}`"
                @click.stop
              >
                {{ tag }}
              </NuxtLink>
            </div>
          </div>
          <span class="text-sm font-bold text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-300">
            阅读文章
          </span>
        </div>
      </NuxtLink>

      <p v-if="!pending && !posts.length" class="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        暂无匹配文章。
      </p>

      <div v-if="pagination && pagination.total > 0" class="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row dark:border-slate-800">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          共 {{ pagination.total }} 篇文章，第 {{ pagination.page }} / {{ pagination.pageCount }} 页
        </p>
        <UPagination
          v-model:page="page"
          :items-per-page="pageSize"
          :sibling-count="1"
          :total="pagination.total"
        />
      </div>
    </section>
  </main>
</template>
