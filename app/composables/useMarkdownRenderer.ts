import { Renderer, marked, type Token } from 'marked'
import { createHighlighter, type Highlighter } from 'shiki'

export type TocItem = {
  id: string
  level: 2 | 3 | 4
  text: string
}

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

// 只列出 shiki 已打包的语言 id，避免 createHighlighter 因未知语言抛错导致整站高亮失效。
const SHIKI_LANGUAGES = [
  'javascript', 'typescript', 'jsx', 'tsx', 'vue', 'html', 'css', 'scss', 'json', 'jsonc',
  'bash', 'shell', 'python', 'sql', 'yaml', 'toml', 'markdown', 'diff', 'go', 'rust',
  'java', 'c', 'cpp', 'php', 'ruby', 'dockerfile', 'nginx', 'xml'
]

let highlighterPromise: Promise<Highlighter | null> | null = null

const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: SHIKI_LANGUAGES
    }).catch(() => null)
  }

  return highlighterPromise
}

const renderCode = (highlighter: Highlighter | null, code: string, lang?: string) => {
  const language = lang ? lang.trim().toLowerCase() : ''

  if (!language || !highlighter) {
    return `<pre><code>${escapeHtml(code)}</code></pre>`
  }

  try {
    return highlighter.codeToHtml(code, {
      lang: language,
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false
    })
  } catch {
    return `<pre><code class="language-${escapeAttribute(language)}">${escapeHtml(code)}</code></pre>`
  }
}

const createRenderer = (highlighter: Highlighter | null, toc?: TocItem[]) => {
  const renderer = new Renderer()
  let headingIndex = 0

  renderer.code = ({ text, lang }) => renderCode(highlighter, text, lang)

  renderer.heading = function ({ tokens, depth }) {
    const level = Math.min(Math.max(depth, 2), 4) as 2 | 3 | 4
    const id = `section-${headingIndex + 1}`
    const text = normalizeHeadingText(flattenText(tokens))

    headingIndex += 1

    if (toc) {
      toc.push({ id, level, text })
    }

    return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>`
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

  return renderer
}

const renderOptions = (renderer: Renderer) => ({
  async: false as const,
  breaks: true,
  gfm: true,
  renderer
})

export const renderMarkdown = async (content: string) => {
  const highlighter = await getHighlighter()
  const renderer = createRenderer(highlighter)

  return marked(content || '预览会显示在这里。', renderOptions(renderer))
}

export const renderArticleMarkdown = async (content: string) => {
  const highlighter = await getHighlighter()
  const toc: TocItem[] = []
  const renderer = createRenderer(highlighter, toc)
  const html = marked(content || '', renderOptions(renderer))

  return { html, toc }
}

export const useMarkdownRenderer = () => ({
  renderMarkdown,
  renderArticleMarkdown
})
