import { Renderer, marked } from 'marked'

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

export const useMarkdownRenderer = () => {
  const renderMarkdown = (content: string) => {
    const renderer = new Renderer()

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

    return marked(content || '预览会显示在这里。', {
      async: false,
      breaks: true,
      gfm: true,
      renderer
    })
  }

  return {
    renderMarkdown
  }
}
