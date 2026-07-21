<script setup lang="ts">
import type { TagsResponse } from '~/types/post'

usePageSeo({
  title: '标签',
  description: '按标签浏览渐晚发布的技术文章。',
  path: '/tags'
})

const { data: tagsResponse, pending } = await useAsyncData('tags', () =>
  $fetch<TagsResponse>('/api/tags')
)

const tags = computed(() => tagsResponse.value?.data ?? [])
</script>

<template>
  <main>
    <section class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-5 py-14">
        <p class="text-sm font-bold text-blue-600 dark:text-blue-300">Tags</p>
        <h1 class="mt-3 text-4xl font-bold text-slate-950 dark:text-white">标签归档</h1>
        <p class="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          从主题切入，快速找到同一方向的文章。
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-12">
      <p v-if="pending" class="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        正在加载标签...
      </p>

      <div v-else-if="tags.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="tag in tags"
          :key="tag.name"
          class="group rounded-lg border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:shadow-black/20"
          :to="`/tags/${encodeURIComponent(tag.name)}`"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
              {{ tag.name }}
            </h2>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {{ tag.count }}
            </span>
          </div>
          <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
            查看该标签下的全部文章
          </p>
        </NuxtLink>
      </div>

      <p v-else class="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        暂无标签。
      </p>
    </section>
  </main>
</template>
