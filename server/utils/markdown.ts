import { marked } from 'marked'

// 服务端轻量 Markdown 渲染（不接 Shiki），用于 RSS content:encoded 等不交互的场景。
export const renderMarkdownPlain = (content: string) =>
  marked(content || '', {
    async: false,
    breaks: true,
    gfm: true
  })
