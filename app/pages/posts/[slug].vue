<script setup lang="ts">
import type { PostResponse } from '~/types/post'

type ContentBlock =
  | {
      type: 'heading'
      id: string
      level: 2 | 3 | 4
      text: string
    }
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'space'
      id: string
    }

type TocItem = {
  id: string
  level: 2 | 3 | 4
  text: string
}

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

const normalizeHeadingText = (value: string) =>
  value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

const parsedContent = computed(() => {
  const blocks: ContentBlock[] = []
  const toc: TocItem[] = []
  const usedIds = new Map<string, number>()
  const lines = post.value?.content.split(/\r?\n/) ?? []

  lines.forEach((line, index) => {
    const heading = line.match(/^(#{1,4})\s+(.+)$/)

    if (heading) {
      const rawLevel = heading[1].length
      const level = Math.min(Math.max(rawLevel, 2), 4) as 2 | 3 | 4
      const text = normalizeHeadingText(heading[2])
      const baseId = `section-${toc.length + 1}`
      const usedCount = usedIds.get(baseId) ?? 0
      const id = usedCount ? `${baseId}-${usedCount + 1}` : baseId

      usedIds.set(baseId, usedCount + 1)
      blocks.push({
        type: 'heading',
        id,
        level,
        text
      })
      toc.push({
        id,
        level,
        text
      })
      return
    }

    if (!line.trim()) {
      blocks.push({
        type: 'space',
        id: `space-${index}`
      })
      return
    }

    blocks.push({
      type: 'text',
      text: line
    })
  })

  return {
    blocks,
    toc
  }
})

const contentBlocks = computed(() => parsedContent.value.blocks)
const tocItems = computed(() => parsedContent.value.toc)
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
            <span>{{ formatDate(post.updatedAt) }}</span>
          </div>
          <h1 class="mt-5 text-4xl font-bold leading-tight text-slate-950 dark:text-white sm:text-5xl">
            {{ post.title }}
          </h1>
          <p class="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {{ post.excerpt || '这篇文章暂时没有摘要。' }}
          </p>
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

        <div class="py-8 text-lg leading-9 text-slate-700 dark:text-slate-300">
          <template v-for="(block, index) in contentBlocks" :key="block.type === 'space' ? block.id : `${block.type}-${index}`">
            <h2
              v-if="block.type === 'heading' && block.level === 2"
              :id="block.id"
              class="scroll-mt-24 pt-8 text-3xl font-bold leading-tight text-slate-950 dark:text-white"
            >
              {{ block.text }}
            </h2>
            <h3
              v-else-if="block.type === 'heading' && block.level === 3"
              :id="block.id"
              class="scroll-mt-24 pt-6 text-2xl font-bold leading-tight text-slate-950 dark:text-white"
            >
              {{ block.text }}
            </h3>
            <h4
              v-else-if="block.type === 'heading' && block.level === 4"
              :id="block.id"
              class="scroll-mt-24 pt-5 text-xl font-bold leading-tight text-slate-950 dark:text-white"
            >
              {{ block.text }}
            </h4>
            <div v-else-if="block.type === 'space'" class="h-4" />
            <p v-else class="whitespace-pre-wrap">
              {{ block.text }}
            </p>
          </template>
        </div>
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
