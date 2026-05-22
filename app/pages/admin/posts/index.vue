<script setup lang="ts">
import type { Post, PostsResponse } from '~/types/post'

definePageMeta({
  layout: 'admin'
})

const pageSize = 10
const page = ref(1)
const keyword = ref('')
const status = ref<'all' | Post['status']>('all')
const errorMessage = ref('')

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' }
] as const

watch([keyword, status], () => {
  page.value = 1
})

const query = computed(() => ({
  limit: pageSize,
  offset: (page.value - 1) * pageSize,
  ...(keyword.value ? { q: keyword.value } : {}),
  ...(status.value !== 'all' ? { status: status.value } : {})
}))

const { data: postsResponse, pending, refresh } = await useAsyncData(
  'admin-posts',
  () => $fetch<PostsResponse>('/api/posts', { query: query.value }),
  {
    watch: [query]
  }
)

const posts = computed(() => postsResponse.value?.data ?? [])
const pagination = computed(() => postsResponse.value?.pagination)

watch(pagination, (value) => {
  if (value && page.value > value.pageCount) {
    page.value = value.pageCount
  }
})

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value))

const deletePost = async (post: Post) => {
  if (!window.confirm(`确定删除《${post.title}》吗？`)) {
    return
  }

  errorMessage.value = ''

  try {
    await $fetch(`/api/posts/${post.id}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败'
  }
}
</script>

<template>
  <section>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">文章管理</h1>
        <p class="mt-2 text-slate-500">管理文章草稿、发布状态和内容入口。</p>
      </div>
      <NuxtLink class="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700" to="/admin/posts/new">
        新建文章
      </NuxtLink>
    </div>

    <p v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <input v-model="keyword" class="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-400 sm:w-80" placeholder="搜索标题" type="search">
        <USelect
          v-model="status"
          class="h-10 w-full !bg-white !text-slate-700 !ring-slate-200 hover:!bg-white focus:!ring-blue-400 dark:!bg-white dark:!text-slate-700 dark:!ring-slate-200 dark:hover:!bg-white sm:w-40"
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
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[860px] border-collapse">
          <thead>
            <tr class="border-b border-slate-100 text-left text-sm text-slate-500">
              <th class="px-5 py-3 font-bold">文章</th>
              <th class="px-5 py-3 font-bold">状态</th>
              <th class="px-5 py-3 font-bold">更新时间</th>
              <th class="px-5 py-3 font-bold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pending">
              <td class="px-5 py-8 text-slate-500" colspan="4">正在加载文章...</td>
            </tr>
            <tr v-for="post in posts" v-else :key="post.id" class="border-b border-slate-100 last:border-0">
              <td class="px-5 py-4">
                <span class="block font-bold text-slate-950">{{ post.title }}</span>
                <span class="mt-1 block text-sm text-slate-500">/{{ post.slug }}</span>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                  :class="post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                >
                  {{ post.status === 'published' ? '已发布' : '草稿' }}
                </span>
              </td>
              <td class="px-5 py-4 text-slate-600">{{ formatDate(post.updatedAt) }}</td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink class="inline-flex h-8 items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100" :to="`/admin/posts/${post.id}`">
                    编辑
                  </NuxtLink>
                  <NuxtLink v-if="post.status === 'published'" class="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" :to="`/posts/${post.slug}`">
                    预览
                  </NuxtLink>
                  <button class="inline-flex h-8 items-center justify-center rounded-md border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:border-red-200 hover:bg-red-100" type="button" @click="deletePost(post)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!pending && !posts.length">
              <td class="px-5 py-8 text-slate-500" colspan="4">暂无文章。</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination && pagination.total > 0" class="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
        <p class="text-sm text-slate-500">
          共 {{ pagination.total }} 篇文章，第 {{ pagination.page }} / {{ pagination.pageCount }} 页
        </p>
        <UPagination
          v-model:page="page"
          class="admin-pagination"
          :items-per-page="pageSize"
          :sibling-count="1"
          :total="pagination.total"
        />
      </div>
    </section>
  </section>
</template>

<style>
.admin-pagination button,
.admin-pagination a {
  background-color: #fff !important;
  color: #475569 !important;
  box-shadow: inset 0 0 0 1px #cbd5e1 !important;
}

.admin-pagination button:hover,
.admin-pagination a:hover {
  background-color: #eff6ff !important;
  color: #1d4ed8 !important;
}

.admin-pagination button[aria-current='page'],
.admin-pagination a[aria-current='page'] {
  background-color: #2563eb !important;
  color: #fff !important;
  box-shadow: inset 0 0 0 1px #2563eb !important;
}

.admin-pagination button:disabled,
.admin-pagination a[aria-disabled='true'] {
  background-color: #f8fafc !important;
  color: #94a3b8 !important;
  box-shadow: inset 0 0 0 1px #e2e8f0 !important;
}
</style>
