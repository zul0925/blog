<script setup lang="ts">
import type { PostResponse, PostStatus } from '~/types/post'

definePageMeta({
  layout: 'admin'
})

const title = ref('')
const excerpt = ref('')
const content = ref('')
const status = ref<PostStatus>('draft')
const pending = ref(false)
const errorMessage = ref('')

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' }
] as const

const savePost = async (nextStatus: PostStatus) => {
  pending.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<PostResponse>('/api/posts', {
      method: 'POST',
      body: {
        title: title.value,
        excerpt: excerpt.value || null,
        content: content.value,
        status: nextStatus
      }
    })

    await navigateTo(`/admin/posts/${response.data.id}`)
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
        <h1 class="text-2xl font-bold text-slate-950">新建文章</h1>
        <p class="mt-2 text-slate-500">填写标题和正文即可，文章链接会自动生成。</p>
      </div>
      <NuxtLink class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700" to="/admin/posts">
        返回列表
      </NuxtLink>
    </div>

    <p v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <form class="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]" @submit.prevent="savePost(status)">
      <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-bold text-slate-950">文章内容</h2>
        </div>
        <div class="grid gap-4 p-5">
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            标题
            <input v-model="title" class="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400" placeholder="输入文章标题">
          </label>
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            摘要
            <textarea v-model="excerpt" class="min-h-28 resize-y rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-blue-400" placeholder="用于列表页和 SEO 的简短摘要" />
          </label>
          <label class="grid gap-2 text-sm font-bold text-slate-700">
            正文 Markdown
            <textarea v-model="content" class="min-h-80 resize-y rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-blue-400" placeholder="# 从这里开始写作" />
          </label>
        </div>
      </section>

      <aside class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-bold text-slate-950">发布设置</h2>
        </div>
        <div class="grid gap-4 p-5">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            系统会根据标题自动生成文章访问地址，重复时会自动追加编号。
          </div>
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
          <button class="h-10 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" :disabled="pending" type="button" @click="savePost('draft')">
            {{ pending ? '保存中...' : '保存草稿' }}
          </button>
          <button class="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60" :disabled="pending" type="button" @click="savePost('published')">
            发布文章
          </button>
        </div>
      </aside>
    </form>
  </section>
</template>
