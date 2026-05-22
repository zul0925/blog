import { getPostById } from '../../services/post.service'
import { getNumericRouterParam } from '../../utils/request'

export default defineEventHandler(async (event) => {
  const id = getNumericRouterParam(event, 'id')
  const data = await getPostById(id)

  return {
    data
  }
})
