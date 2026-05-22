<script setup lang="ts">
import type { Post, PostsResponse } from '~/types/post'

definePageMeta({
  layout: 'admin'
})

const { data: postsResponse, refresh } = await useAsyncData('admin-dashboard-posts', () =>
  $fetch<PostsResponse>('/api/posts', {
    query: {
      limit: 100
    }
  })
)

const posts = computed(() => postsResponse.value?.data ?? [])
const publishedCount = computed(() => posts.value.filter((post) => post.status === 'published').length)
const draftCount = computed(() => posts.value.filter((post) => post.status === 'draft').length)
const recentPosts = computed(() => posts.value.slice(0, 5))

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value))

const statusText = (status: Post['status']) => status === 'published' ? '已发布' : '草稿'
</script>

<template>
  <section>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-950">后台概览</h1>
        <p class="mt-2 text-slate-500">查看内容状态，并快速进入文章管理流程。</p>
      </div>
      <div class="flex gap-2">
        <button class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700" type="button" @click="refresh()">
          刷新
        </button>
        <NuxtLink class="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700" to="/admin/posts/new">
          新建文章
        </NuxtLink>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-sm text-slate-500">全部文章</span>
        <strong class="mt-2 block text-3xl text-slate-950">{{ posts.length }}</strong>
      </article>
      <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-sm text-slate-500">已发布</span>
        <strong class="mt-2 block text-3xl text-slate-950">{{ publishedCount }}</strong>
      </article>
      <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-sm text-slate-500">草稿</span>
        <strong class="mt-2 block text-3xl text-slate-950">{{ draftCount }}</strong>
      </article>
      <article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-sm text-slate-500">内容来源</span>
        <strong class="mt-2 block text-3xl text-slate-950">DB</strong>
      </article>
    </div>

    <div class="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
      <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 class="font-bold text-slate-950">最近文章</h2>
          <NuxtLink class="text-sm font-bold text-blue-600" to="/admin/posts">查看全部</NuxtLink>
        </div>
        <ul v-if="recentPosts.length" class="divide-y divide-slate-100 p-5">
          <li v-for="post in recentPosts" :key="post.id" class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div>
              <strong class="block text-slate-900">{{ post.title }}</strong>
              <span class="text-sm text-slate-500">{{ formatDate(post.updatedAt) }}</span>
            </div>
            <span class="text-sm text-slate-500">{{ statusText(post.status) }}</span>
          </li>
        </ul>
        <p v-else class="p-5 text-sm text-slate-500">暂无文章。</p>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-bold text-slate-950">服务端状态</h2>
        </div>
        <ul class="divide-y divide-slate-100 p-5">
          <li class="flex items-center justify-between gap-4 py-3 first:pt-0">
            <span class="font-bold text-slate-900">文章 API</span>
            <span class="text-sm text-emerald-600">已接入</span>
          </li>
          <li class="flex items-center justify-between gap-4 py-3">
            <span class="font-bold text-slate-900">PostgreSQL</span>
            <span class="text-sm text-emerald-600">已连接</span>
          </li>
          <li class="flex items-center justify-between gap-4 py-3 last:pb-0">
            <span class="font-bold text-slate-900">登录保护</span>
            <span class="text-sm text-emerald-600">已启用</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
