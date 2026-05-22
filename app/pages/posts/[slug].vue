<script setup lang="ts">
import type { PostResponse } from '~/types/post'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: postResponse } = await useAsyncData(`post-${slug.value}`, () =>
  $fetch<PostResponse>(`/api/posts/slug/${slug.value}`)
)

const post = computed(() => postResponse.value?.data)

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '文章不存在'
  })
}

usePageSeo({
  title: post.value.title,
  description: post.value.excerpt || `${post.value.title} - 渐晚技术博客文章。`,
  path: `/posts/${post.value.slug}`,
  type: 'article'
})

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value))
</script>

<template>
  <main v-if="post">
    <article class="mx-auto max-w-3xl px-5 py-14">
      <NuxtLink class="text-sm font-bold text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300" to="/posts">
        返回文章列表
      </NuxtLink>

      <header class="mt-8 border-b border-slate-200 pb-8 dark:border-slate-800">
        <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span class="font-semibold text-blue-600 dark:text-blue-300">{{ post.status === 'published' ? 'Published' : 'Draft' }}</span>
          <span>{{ formatDate(post.updatedAt) }}</span>
        </div>
        <h1 class="mt-5 text-4xl font-bold leading-tight text-slate-950 dark:text-white sm:text-5xl">
          {{ post.title }}
        </h1>
        <p class="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
          {{ post.excerpt || '这篇文章暂时没有摘要。' }}
        </p>
      </header>

      <div class="space-y-6 whitespace-pre-wrap py-8 text-lg leading-9 text-slate-700 dark:text-slate-300">
        {{ post.content }}
      </div>
    </article>
  </main>
</template>
