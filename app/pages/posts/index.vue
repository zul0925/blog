<script setup lang="ts">
import type { PostsResponse } from '~/types/post'

const pageSize = 6
const page = ref(1)

const query = computed(() => ({
  status: 'published',
  limit: pageSize,
  offset: (page.value - 1) * pageSize
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
              <span>{{ formatDate(post.updatedAt) }}</span>
            </div>
            <h2 class="mt-3 text-2xl font-bold text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
              {{ post.title }}
            </h2>
            <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">
              {{ post.excerpt || '这篇文章暂时没有摘要。' }}
            </p>
          </div>
          <span class="text-sm font-bold text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-300">
            阅读文章
          </span>
        </div>
      </NuxtLink>

      <p v-if="!pending && !posts.length" class="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        暂无已发布文章。
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
