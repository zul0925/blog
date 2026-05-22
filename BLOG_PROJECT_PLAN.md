# Nuxt 全栈个人博客实施计划

## 1. 项目目标

做一个基于 Vue3 技术栈的全栈个人博客，用来展示文章、项目和个人能力，同时系统提升 Nuxt 全栈开发能力。

第一版目标不是功能越多越好，而是先跑通完整闭环：

```txt
后台登录 -> 新建文章 -> 保存到数据库 -> 前台展示文章
```

完成这个闭环后，再逐步扩展评论、搜索、统计、上传、订阅等功能。

## 2. 技术选型

```txt
前端/全栈框架：Nuxt
服务端：Nitro server/api
数据库：PostgreSQL
ORM：Drizzle ORM
UI 组件库：Nuxt UI
数据校验：Zod
文章编辑：Markdown 编辑器
样式方案：Tailwind CSS
语言：TypeScript
包管理器：yarn
部署：Vercel / Cloudflare Pages + Supabase / Neon
```

各技术职责：

```txt
Nuxt：页面、路由、布局、SSR、SEO、全栈应用结构
Nitro：服务端 API、服务端中间件、部署适配
PostgreSQL：存储文章、用户、标签、评论等业务数据
Drizzle：数据库 schema、迁移、类型安全查询
Nuxt UI：后台管理界面、表单、弹窗、表格等 UI 组件
Zod：接口参数、表单、环境变量校验
Markdown 编辑器：后台写文章、预览、发布
```

## 3. 仓库管理方式

当前阶段使用单仓库、单 Nuxt 应用，不拆前后端仓库。

推荐结构：

```txt
blog/
  app.vue
  nuxt.config.ts
  package.json
  .env.example

  pages/
    index.vue
    posts/
      index.vue
      [slug].vue
    admin/
      index.vue
      posts/
        index.vue
        new.vue
        [id].vue

  components/
    app/
      AppHeader.vue
      AppFooter.vue
    post/
      PostCard.vue
      PostEditor.vue
      MarkdownPreview.vue
    admin/
      AdminSidebar.vue
      AdminPageHeader.vue

  layouts/
    default.vue
    admin.vue

  middleware/
    auth.ts

  server/
    api/
      posts/
        index.get.ts
        index.post.ts
        [id].get.ts
        [id].put.ts
        [id].delete.ts
      auth/
        login.post.ts
        logout.post.ts
        me.get.ts
    db/
      index.ts
      schema.ts
    services/
      post.service.ts
      auth.service.ts
    utils/
      validation.ts

  shared/
    schemas/
      post.schema.ts
    types/
      post.ts

  drizzle/
    migrations/
```

单仓库的好处：

```txt
前后端类型共享
接口和页面联调简单
部署链路简单
Nuxt/Nitro 能力练得完整
适合个人项目长期维护
```

只有当后端需要服务 Web、小程序、App，或者业务复杂到需要独立扩容时，再考虑拆成 monorepo 或前后端分仓。

## 4. 开发阶段总览

```txt
阶段 1：项目初始化和基础布局
阶段 2：数据库和 Drizzle 接入
阶段 3：文章 CRUD API
阶段 4：后台文章管理
阶段 5：前台文章展示
阶段 6：后台登录和权限保护
阶段 7：Markdown 编辑体验
阶段 8：标签、搜索、SEO、RSS、sitemap
阶段 9：评论、上传、统计等进阶功能
阶段 10：部署、优化和作品包装
```

## 5. 阶段 1：项目初始化和基础布局

目标：创建 Nuxt 项目，并搭好前台和后台的基础页面骨架。

执行步骤：

```bash
yarn create nuxt blog
cd blog
yarn install
yarn add @nuxt/ui zod drizzle-orm postgres
yarn add -D drizzle-kit
yarn dev --open
```

配置 `nuxt.config.ts`：

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css']
})
```

需要完成：

```txt
首页 pages/index.vue
文章列表页 pages/posts/index.vue
文章详情页 pages/posts/[slug].vue
后台首页 pages/admin/index.vue
文章管理页 pages/admin/posts/index.vue
新建文章页 pages/admin/posts/new.vue
编辑文章页 pages/admin/posts/[id].vue
默认布局 layouts/default.vue
后台布局 layouts/admin.vue
```

验收标准：

```txt
项目能正常启动
前台页面能访问
后台页面能访问
基础导航可用
页面布局不依赖真实数据
```

## 6. 阶段 2：数据库和 Drizzle 接入

目标：准备 PostgreSQL，并用 Drizzle 管理数据库 schema 和迁移。

数据库选择：

```txt
开发省事：Supabase / Neon
本地优先：Docker PostgreSQL
```

环境变量：

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

创建数据库目录：

```txt
server/db/index.ts
server/db/schema.ts
drizzle.config.ts
```

第一版只需要 `posts` 表：

```ts
import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
```

验收标准：

```txt
Drizzle 能生成迁移文件
迁移能成功执行到 PostgreSQL
server/db/index.ts 能导出可用的 db 实例
```

## 7. 阶段 3：文章 CRUD API

目标：实现服务端文章增删改查接口。

接口清单：

```txt
GET    /api/posts          获取文章列表
POST   /api/posts          创建文章
GET    /api/posts/:id      获取文章详情
PUT    /api/posts/:id      更新文章
DELETE /api/posts/:id      删除文章
```

推荐文件：

```txt
server/api/posts/index.get.ts
server/api/posts/index.post.ts
server/api/posts/[id].get.ts
server/api/posts/[id].put.ts
server/api/posts/[id].delete.ts
shared/schemas/post.schema.ts
server/services/post.service.ts
```

Zod schema：

```ts
import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  status: z.enum(['draft', 'published'])
})

export const updatePostSchema = createPostSchema.partial()
```

验收标准：

```txt
可以通过 API 创建文章
可以查询文章列表
可以查询单篇文章
可以更新文章
可以删除文章
写入接口都有 Zod 校验
slug 重复时有明确错误
```

## 8. 阶段 4：后台文章管理

目标：完成后台文章列表、新建、编辑、删除流程。

页面功能：

```txt
/admin/posts           文章列表
/admin/posts/new       新建文章
/admin/posts/[id]      编辑文章
```

文章列表需要支持：

```txt
标题
slug
状态
创建时间
更新时间
编辑按钮
删除按钮
```

文章表单需要包含：

```txt
标题
slug
摘要
内容
状态：draft / published
保存按钮
发布按钮
```

验收标准：

```txt
后台可以新建文章
后台可以编辑文章
后台可以删除文章
后台可以区分草稿和发布状态
表单提交时有 loading 和错误反馈
```

## 9. 阶段 5：前台文章展示

目标：让普通访问者能看到已发布文章。

页面：

```txt
/posts             已发布文章列表
/posts/[slug]      已发布文章详情
```

前台只展示：

```txt
status = published
```

文章详情页需要包含：

```txt
标题
摘要
发布时间
正文 Markdown 渲染结果
SEO meta
```

验收标准：

```txt
草稿文章无法在前台访问
发布文章可以通过 slug 访问
文章详情刷新后仍正常渲染
不存在的 slug 返回 404
```

## 10. 阶段 6：后台登录和权限保护

目标：保护 `/admin` 后台页面和写入接口。

第一版可以使用简单管理员账号：

```txt
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
SESSION_SECRET
```

接口：

```txt
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

需要保护：

```txt
/admin/**
POST /api/posts
PUT /api/posts/:id
DELETE /api/posts/:id
```

验收标准：

```txt
未登录访问 /admin 会跳转到登录页
登录后可以进入后台
退出登录后不能继续操作后台
未登录调用写入 API 会返回 401
session 使用 HTTP-only cookie
```

## 11. 阶段 7：Markdown 编辑体验

目标：提升写作体验，但不做复杂富文本。

第一版推荐：

```txt
左侧 Markdown 输入
右侧实时预览
支持代码块高亮
支持保存草稿
支持发布前预览
```

编辑器选择：

```txt
最简单：textarea + Markdown 渲染
更像代码编辑器：Monaco Editor
更像内容编辑器：Milkdown
```

建议先用 textarea 或 Monaco Editor，不要一开始接复杂富文本。

验收标准：

```txt
编辑时可以实时预览
代码块显示正常
保存后内容不丢失
再次编辑能正确回显
```

## 12. 阶段 8：标签、搜索、SEO、RSS、sitemap

目标：把博客从可用提升到完整。

标签功能：

```txt
tags
post_tags
文章编辑时选择标签
前台按标签筛选
```

搜索功能：

```txt
第一版：数据库标题/摘要搜索
后续：PostgreSQL full-text search 或 Pagefind
```

SEO：

```txt
useSeoMeta
文章详情动态 title / description
Open Graph 信息
canonical URL
```

RSS 和 sitemap：

```txt
server/routes/rss.xml.ts
server/routes/sitemap.xml.ts
```

验收标准：

```txt
文章可以绑定标签
前台可以按标签筛选
站内搜索可用
文章页面有正确 meta 信息
RSS 可访问
sitemap 可访问
```

## 13. 阶段 9：评论、上传、统计等进阶功能

目标：增加真实业务复杂度。

可选功能：

```txt
评论系统
评论审核
图片上传
访问量统计
点赞
邮件订阅
项目展示页
后台数据看板
文章版本历史
定时发布
```

推荐实现顺序：

```txt
图片上传
评论审核
访问统计
项目展示
数据看板
```

对象存储选择：

```txt
Cloudflare R2
Supabase Storage
S3 兼容存储
```

验收标准：

```txt
图片能上传并插入文章
评论需要审核后展示
后台能看到基础访问数据
项目页能展示个人项目
```

## 14. 阶段 10：部署、优化和作品包装

目标：让项目可以被访问，并作为作品展示。

部署组合：

```txt
Nuxt 应用：Vercel / Cloudflare Pages
PostgreSQL：Supabase / Neon
对象存储：Cloudflare R2 / Supabase Storage
```

上线前检查：

```txt
环境变量完整
数据库迁移已执行
后台登录可用
前台文章可访问
404 页面正常
移动端布局正常
SEO 信息正常
构建无错误
```

作品包装：

```txt
README 写清楚技术栈
README 写清楚功能列表
README 放部署地址
README 放项目截图
README 写本地启动方式
README 写数据库迁移方式
```

验收标准：

```txt
线上站点可访问
线上后台可登录
可以在线发布文章
GitHub 仓库 README 完整
项目可以作为简历作品展示
```

## 15. Git 分支和提交建议

分支策略保持简单：

```txt
main：稳定可部署版本
dev：日常开发分支
feature/*：较大的功能分支
```

提交信息建议：

```txt
feat: add post crud api
feat: add admin post editor
fix: handle duplicate post slug
refactor: move post queries to service
docs: add project setup guide
chore: configure drizzle
```

每个阶段完成后建议打一个小 checkpoint：

```txt
git add .
git commit -m "feat: initialize nuxt blog app"
```

## 16. 当前最优先要做的事

不要先做评论、搜索、主题、动画和复杂首页。

第一周只做这个闭环：

```txt
1. 初始化 Nuxt 项目
2. 搭好前台和后台路由
3. 接 PostgreSQL 和 Drizzle
4. 实现 posts 表
5. 实现文章 CRUD API
6. 实现后台新建文章页面
7. 实现前台文章详情页
```

只要完成：

```txt
/admin/posts/new 写文章
保存到 PostgreSQL
/posts/[slug] 能看到文章
```

这个项目就真正成型了。
