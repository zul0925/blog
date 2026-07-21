import { listTags } from '../../services/post.service'

export default defineEventHandler(async () => {
  const data = await listTags()

  return {
    data
  }
})
