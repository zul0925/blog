export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  content: string[]
  category: string
  date: string
  readTime: string
  tags: string[]
}

export const posts: BlogPost[] = [
  {
    slug: 'nuxt-fullstack-blog-roadmap',
    title: 'Nuxt 全栈博客的第一阶段路线',
    excerpt: '从页面骨架、后台管理到文章 API，先把最小可用的内容闭环跑通。',
    category: '工程实践',
    date: '2026-05-21',
    readTime: '6 min',
    tags: ['Nuxt', 'Fullstack', 'Roadmap'],
    content: [
      '第一阶段的重点不是堆功能，而是把内容从后台创建、保存、读取、展示这条主链路走通。这个闭环跑起来之后，搜索、评论、统计和订阅才有稳定的基础。',
      'Nuxt 适合这个项目的原因是页面、服务端 API、SSR 和部署模型可以放在一个工程里推进。对于个人博客这种规模，先保持单仓库和单应用能减少很多沟通和维护成本。',
      '后台页面可以先使用静态假数据完成交互和视觉结构，再逐步替换为 Drizzle 查询和真实 API。这样 UI、数据结构和接口边界能更早暴露问题。'
    ]
  },
  {
    slug: 'drizzle-postgres-content-model',
    title: '用 Drizzle 和 PostgreSQL 设计文章模型',
    excerpt: '文章表先保持克制，围绕标题、slug、正文、摘要和状态建立稳定 schema。',
    category: '数据库',
    date: '2026-05-18',
    readTime: '5 min',
    tags: ['Drizzle', 'PostgreSQL', 'Schema'],
    content: [
      '文章模型的第一版应该足够简单：标题、slug、摘要、正文、发布状态、创建时间和更新时间。分类、标签、封面和 SEO 字段可以随后扩展。',
      'Drizzle 的价值在于 schema 和 TypeScript 类型能保持一致。服务端 API 写查询时，可以更早发现字段命名、可空值和返回结构的问题。',
      'slug 建议做唯一约束，因为它会成为前台详情页的稳定地址。后续做静态生成、SEO 和分享链接时，这个约束会很有用。'
    ]
  },
  {
    slug: 'clean-admin-writing-experience',
    title: '后台写作体验应该先解决什么',
    excerpt: '一个好的写作后台不需要一开始就复杂，但必须让标题、正文、状态和预览路径清晰。',
    category: '产品设计',
    date: '2026-05-12',
    readTime: '4 min',
    tags: ['Admin', 'Markdown', 'UX'],
    content: [
      '写作后台的第一优先级是减少决策负担。标题、摘要、正文、slug 和状态应该稳定摆放，保存和发布按钮也应该有明确层级。',
      'Markdown 编辑器可以分阶段做。早期用 textarea 完成输入，随后再加入预览、快捷工具栏、自动保存和图片上传。',
      '不要过早把后台做成信息密度很高的系统。个人博客后台更重要的是持续可维护，页面要清楚、安静、可扩展。'
    ]
  }
]

export const featuredPost = posts[0]
