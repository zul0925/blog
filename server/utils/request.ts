import type { H3Event } from 'h3'
import { ZodError, type ZodSchema } from 'zod'

const formatValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message).join('; ')

const normalizeValidationError = (error: unknown) => {
  if (error instanceof ZodError) {
    throw createError({
      statusCode: 400,
      statusMessage: formatValidationError(error)
    })
  }

  throw error
}

export const parseRequestBody = async <T>(event: H3Event, schema: ZodSchema<T>) => {
  try {
    const body = await readBody(event)
    return schema.parse(body)
  } catch (error) {
    normalizeValidationError(error)
  }
}

export const parseRequestQuery = <T>(event: H3Event, schema: ZodSchema<T>) => {
  try {
    return schema.parse(getQuery(event))
  } catch (error) {
    normalizeValidationError(error)
  }
}

export const getNumericRouterParam = (event: H3Event, name: string) => {
  const value = Number(getRouterParam(event, name))

  if (!Number.isInteger(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `${name} 必须是正整数`
    })
  }

  return value
}
