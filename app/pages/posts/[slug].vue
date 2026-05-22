<script setup lang="ts">
import { Renderer, lexer, marked, type Token, type Tokens } from 'marked'
import type { PostResponse } from '~/types/post'

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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const escapeAttribute = (value: string) => escapeHtml(value).replace(/`/g, '&#96;')

const isSafeUrl = (value: string) => {
  if (!value) {
    return false
  }

  if (value.startsWith('/') || value.startsWith('#')) {
    return true
  }

  try {
    return ['http:', 'https:', 'mailto:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const normalizeHeadingText = (value: string) =>
  value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

const flattenText = (tokens: Token[] = []): string =>
  tokens
    .map((token) => {
      if ('tokens' in token && Array.isArray(token.tokens)) {
        return flattenText(token.tokens)
      }

      if ('text' in token && typeof token.text === 'string') {
        return token.text
      }

      return ''
    })
    .join('')

const extractTocItems = (content: string) => {
  const toc: TocItem[] = []
  const tokens = lexer(content, {
    gfm: true
  })

  tokens.forEach((token) => {
    if (token.type === 'heading') {
      const heading = token as Tokens.Heading
      const level = Math.min(Math.max(heading.depth, 2), 4) as 2 | 3 | 4
      const text = normalizeHeadingText(flattenText(heading.tokens) || heading.text)

      toc.push({
        id: `section-${toc.length + 1}`,
        level,
        text
      })
    }
  })

  return toc
}

const renderMarkdown = (content: string) => {
  const renderer = new Renderer()
  let headingIndex = 0

  renderer.heading = function ({ tokens, depth }) {
    const level = Math.min(Math.max(depth, 2), 4)
    const id = `section-${headingIndex + 1}`
    const text = this.parser.parseInline(tokens)

    headingIndex += 1

    return `<h${level} id="${id}">${text}</h${level}>`
  }

  renderer.html = ({ text }) => escapeHtml(text)

  renderer.link = function ({ href, title, tokens }) {
    if (!isSafeUrl(href)) {
      return this.parser.parseInline(tokens)
    }

    const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : ''
    const isExternal = /^https?:\/\//i.test(href)
    const targetAttributes = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''

    return `<a href="${escapeAttribute(href)}"${titleAttribute}${targetAttributes}>${this.parser.parseInline(tokens)}</a>`
  }

  renderer.image = ({ href, title, text }) => {
    if (!isSafeUrl(href)) {
      return escapeHtml(text)
    }

    const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : ''

    return `<img src="${escapeAttribute(href)}" alt="${escapeAttribute(text)}"${titleAttribute}>`
  }

  return marked(content, {
    async: false,
    breaks: true,
    gfm: true,
    renderer
  })
}

const renderedContent = computed(() => renderMarkdown(post.value?.content ?? ''))
const tocItems = computed(() => extractTocItems(post.value?.content ?? ''))
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

        <div class="markdown-body py-8" v-html="renderedContent" />
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
