export type PostStatus = 'draft' | 'published'

export type Post = {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
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
