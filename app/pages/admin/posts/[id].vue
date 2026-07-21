<script setup lang="ts">
import type { PostResponse, PostStatus } from '~/types/post'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const id = computed(() => Number(route.params.id))
const { renderMarkdown } = useMarkdownRenderer()

const { data: postResponse, refresh } = await useAsyncData(`admin-post-${id.value}`, () =>
  $fetch<PostResponse>(`/api/posts/${id.value}`)
)

const title = ref('')
const slug = ref('')
const excerpt = ref('')
const content = ref('')
const tags = ref<string[]>([])
const isOriginal = ref(true)
const status = ref<PostStatus>('draft')
const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' }
] as const

const previewHtml = ref('')
let previewTimer: ReturnType<typeof setTimeout> | undefined

const updatePreview = (value: string) => {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }

  previewTimer = setTimeout(async () => {
    try {
      previewHtml.value = await renderMarkdown(value)
    } catch {
      previewHtml.value = ''
    }
  }, 250)
}

watch(content, (value) => updatePreview(value), { immediate: true })

onUnmounted(() => {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }
})

const wordCount = computed(() => content.value.trim().replace(/\s+/g, '').length)
const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 500)))

const fillForm = () => {
  const post = postResponse.value?.data

  if (!post) {
    return
  }

  title.value = post.title
  slug.value = post.slug
  excerpt.value = post.excerpt ?? ''
  content.value = post.content
  tags.value = post.tags
  isOriginal.value = post.isOriginal
  status.value = post.status
}

fillForm()

watch(postResponse, fillForm)

const updatePost = async () => {
  pending.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch(`/api/posts/${id.value}`, {
      method: 'PUT',
      body: {
        title: title.value,
        excerpt: excerpt.value || null,
        content: content.value,
        tags: tags.value,
        isOriginal: isOriginal.value,
        status: status.value
      }
    })
    successMessage.value = '文章已保存'
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">编辑文章 #{{ route.params.id }}</h1>
        <p class="mt-2 text-slate-500">调整文章内容和发布状态，右侧可以实时预览 Markdown 渲染效果。</p>
      </div>
      <NuxtLink class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700" to="/admin/posts">
        返回列表
      </NuxtLink>
    </div>

    <p v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {{ successMessage }}
    </p>

    <form class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]" @submit.prevent="updatePost">
      <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-bold text-slate-950">文章内容</h2>
        </div>
        <div class="grid gap-4 p-5">
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            标题
            <input v-model="title" class="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400">
          </label>
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            摘要
            <textarea v-model="excerpt" class="min-h-28 resize-y rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-blue-400" />
          </label>
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            标签
            <UInputTags
              v-model="tags"
              class="w-full"
              placeholder="输入标签后回车"
            />
          </label>
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            正文 Markdown
            <textarea v-model="content" class="min-h-[32rem] resize-y rounded-lg border border-slate-200 p-3 font-mono text-sm font-normal leading-7 outline-none focus:border-blue-400" />
          </label>
        </div>
      </section>

      <aside class="grid gap-4 self-start">
        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="font-bold text-slate-950">发布设置</h2>
          </div>
          <div class="grid gap-4 p-5">
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              当前地址：/posts/{{ slug }}
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span class="block text-slate-500">字数</span>
                <strong class="mt-1 block text-slate-950">{{ wordCount }}</strong>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span class="block text-slate-500">预计阅读</span>
                <strong class="mt-1 block text-slate-950">{{ readingMinutes }} 分钟</strong>
              </div>
            </div>
            <label class="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 text-sm font-bold text-slate-700">
              <span>{{ isOriginal ? '原创' : '转载' }}</span>
              <USwitch v-model="isOriginal" />
            </label>
            <label class="grid gap-2 text-sm font-bold text-slate-700">
              状态
              <USelect
                v-model="status"
                class="w-full !bg-white !text-slate-700 !ring-slate-200 hover:!bg-white focus:!ring-blue-400 dark:!bg-white dark:!text-slate-700 dark:!ring-slate-200 dark:hover:!bg-white"
                color="neutral"
                :items="statusOptions"
                label-key="label"
                :ui="{
                  base: '!bg-white !text-slate-700 !ring-slate-200 hover:!bg-white dark:!bg-white dark:!text-slate-700 dark:!ring-slate-200',
                  content: '!bg-white !text-slate-700 !ring-slate-200 dark:!bg-white dark:!text-slate-700 dark:!ring-slate-200',
                  item: '!text-slate-700 dark:!text-slate-700 data-highlighted:before:!bg-blue-50 dark:data-highlighted:before:!bg-blue-50',
                  itemLabel: '!text-slate-700 dark:!text-slate-700',
                  trailingIcon: '!text-slate-400 dark:!text-slate-400',
                  value: '!text-slate-700 dark:!text-slate-700'
                }"
                value-key="value"
                variant="outline"
              />
            </label>
            <button class="h-10 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" :disabled="pending" type="submit">
              {{ pending ? '保存中...' : '保存修改' }}
            </button>
            <NuxtLink v-if="status === 'published'" class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700" :to="`/posts/${slug}`">
              预览文章
            </NuxtLink>
          </div>
        </section>

        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="font-bold text-slate-950">实时预览</h2>
          </div>
          <div class="max-h-[44rem] overflow-y-auto p-5">
            <div class="markdown-body markdown-preview" v-html="previewHtml" />
          </div>
        </section>
      </aside>
    </form>
  </section>
</template>
