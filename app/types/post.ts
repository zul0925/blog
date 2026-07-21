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

export type PostNavigation = {
  id: number
  title: string
  slug: string
  updatedAt: string
}

export type PostSummary = {
  id: number
  title: string
  slug: string
  excerpt: string | null
  updatedAt: string
}

export type PostDetailResponse = {
  data: Post
  prev: PostNavigation | null
  next: PostNavigation | null
  related: PostSummary[]
}

export type TagSummary = {
  name: string
  count: number
}

export type TagsResponse = {
  data: TagSummary[]
}
