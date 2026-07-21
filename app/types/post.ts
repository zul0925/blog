export type PostStatus = 'draft' | 'published'

export type Post = {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  tags: string[]
  isOriginal: boolean
  status: PostStatus
  createdAt: string
  updatedAt: string
}

export type PostsResponse = {
  data: Post[]
  pagination: {
    total: number
    page: number
    pageSize: number
    pageCount: number
    limit: number
    offset: number
  }
}

export type PostResponse = {
  data: Post
}

export type TagSummary = {
  name: string
  count: number
}

export type TagsResponse = {
  data: TagSummary[]
}
