import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const ADMIN_SESSION_COOKIE = 'admin_session'
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8
const ADMIN_SESSION_VERSION = 1

type AdminSessionPayload = {
  version: typeof ADMIN_SESSION_VERSION
  sub: 'admin'
  username: string
  iat: number
  exp: number
  nonce: string
}

const getSessionSecret = () => {
  const config = useRuntimeConfig()
  const secret = config.adminSessionSecret

  if (secret) {
    return secret
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Admin session secret is not configured'
  })
}

const encodeJson = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')

const decodeJson = <T>(value: string): T => JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T

const sign = (value: string) => createHmac('sha256', getSessionSecret()).update(value).digest('base64url')

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export const safeCompareSecret = (left: string, right: string) => {
  const leftHash = createHash('sha256').update(left).digest()
  const rightHash = createHash('sha256').update(right).digest()

  return timingSafeEqual(leftHash, rightHash)
}

export const setAdminSession = (event: H3Event, username: string) => {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    version: ADMIN_SESSION_VERSION,
    sub: 'admin',
    username,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE,
    nonce: randomBytes(24).toString('base64url')
  }
  const encodedPayload = encodeJson(payload)
  const token = `${encodedPayload}.${sign(encodedPayload)}`

  setCookie(event, ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/'
  })
}

export const clearAdminSession = (event: H3Event) => {
  deleteCookie(event, ADMIN_SESSION_COOKIE, {
    path: '/'
  })
}

export const getAdminSession = (event: H3Event) => {
  const session = getCookie(event, ADMIN_SESSION_COOKIE)

  if (!session) {
    return null
  }

  const [encodedPayload, signature] = session.split('.')

  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) {
    return null
  }

  try {
    const payload = decodeJson<AdminSessionPayload>(encodedPayload)
    const now = Math.floor(Date.now() / 1000)

    if (
      payload.version !== ADMIN_SESSION_VERSION ||
      payload.sub !== 'admin' ||
      !payload.username ||
      !payload.nonce ||
      payload.exp <= now
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export const requireAdminSession = (event: H3Event) => {
  const session = getAdminSession(event)

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return session
}
