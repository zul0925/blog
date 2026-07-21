<script setup lang="ts">
import type { PostDetailResponse } from '~/types/post'
import type { TocItem } from '~/composables/useMarkdownRenderer'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { renderArticleMarkdown } = useMarkdownRenderer()

const { data } = await useAsyncData(`post-${slug.value}`, async () => {
  const response = await $fetch<PostDetailResponse>(`/api/posts/slug/${slug.value}`)
  const { html, toc } = await renderArticleMarkdown(response.data.content)

  return {
    post: response.data,
    prev: response.prev,
    next: response.next,
    related: response.related,
    html,
    toc
  }
})

const post = computed(() => data.value?.post)
const prev = computed(() => data.value?.prev ?? null)
const next = computed(() => data.value?.next ?? null)
const related = computed(() => data.value?.related ?? [])
const renderedContent = computed(() => data.value?.html ?? '')
const tocItems = computed(() => (data.value?.toc ?? []) as TocItem[])

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
    <div class="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <article class="min-w-0">
        <NuxtLink class="text-sm font-bold text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300" to="/posts">
          返回文章列表
        </NuxtLink>

        <header class="mt-8 border-b border-slate-200 pb-8 dark:border-slate-800">
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span class="font-semibold text-blue-600 dark:text-blue-300">{{ post.status === 'published' ? 'Published' : 'Draft' }}</span>
            <span>{{ post.isOriginal ? '原创' : '转载' }}</span>
            <span>{{ formatDate(post.updatedAt) }}</span>
          </div>
          <h1 class="mt-5 text-4xl font-bold leading-tight text-slate-950 dark:text-white sm:text-5xl">
            {{ post.title }}
          </h1>
          <p class="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {{ post.excerpt || '这篇文章暂时没有摘要。' }}
          </p>
          <div v-if="post.tags.length" class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {{ tag }}
            </span>
          </div>
        </header>

        <nav v-if="tocItems.length" class="mt-8 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:hidden" aria-label="文章大纲">
          <h2 class="text-sm font-bold text-slate-950 dark:text-white">文章大纲</h2>
          <ol class="mt-4 grid gap-2 text-sm">
            <li v-for="item in tocItems" :key="item.id">
              <a
                class="block text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
                :class="{
                  'pl-0': item.level === 2,
                  'pl-4': item.level === 3,
                  'pl-8': item.level === 4
                }"
                :href="`#${item.id}`"
              >
                {{ item.text }}
              </a>
            </li>
          </ol>
        </nav>

        <div class="markdown-body py-8" v-html="renderedContent" />

        <nav v-if="prev || next" class="mt-4 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2 dark:border-slate-800" aria-label="文章导航">
          <NuxtLink
            v-if="prev"
            class="group rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
            :to="`/posts/${prev.slug}`"
          >
            <span class="text-xs font-bold text-slate-400 dark:text-slate-500">← 上一篇</span>
            <span class="mt-1 block font-bold leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
              {{ prev.title }}
            </span>
          </NuxtLink>
          <span v-else class="hidden sm:block" />

          <NuxtLink
            v-if="next"
            class="group rounded-lg border border-slate-200 bg-white p-4 text-right transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm sm:col-start-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
            :to="`/posts/${next.slug}`"
          >
            <span class="text-xs font-bold text-slate-400 dark:text-slate-500">下一篇 →</span>
            <span class="mt-1 block font-bold leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
              {{ next.title }}
            </span>
          </NuxtLink>
        </nav>

        <section v-if="related.length" class="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
          <h2 class="text-sm font-bold text-slate-950 dark:text-white">相关文章</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <NuxtLink
              v-for="item in related"
              :key="item.id"
              class="group rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
              :to="`/posts/${item.slug}`"
            >
              <span class="text-xs text-slate-400 dark:text-slate-500">{{ formatDate(item.updatedAt) }}</span>
              <span class="mt-1 block font-bold leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                {{ item.title }}
              </span>
            </NuxtLink>
          </div>
        </section>
      </article>

      <aside v-if="tocItems.length" class="hidden lg:block">
        <div class="toc-scroll sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="text-sm font-bold text-slate-950 dark:text-white">文章大纲</h2>
          <ol class="mt-4 grid gap-2 text-sm">
            <li v-for="item in tocItems" :key="item.id">
              <a
                class="block border-l border-slate-200 py-1 text-slate-500 transition hover:border-blue-500 hover:text-blue-700 dark:border-slate-800 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:text-blue-300"
                :class="{
                  'pl-3': item.level === 2,
                  'pl-6': item.level === 3,
                  'pl-9': item.level === 4
                }"
                :href="`#${item.id}`"
              >
                {{ item.text }}
              </a>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  </main>
</template>
