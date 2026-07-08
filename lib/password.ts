import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Hash a plaintext password using scrypt (built into Node — no extra deps).
// Stored format: "<saltHex>:<hashHex>"
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

// Verify a plaintext password against a stored "<salt>:<hash>" value.
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  const hashBuf = scryptSync(password, salt, 64)
  const keyBuf = Buffer.from(key, 'hex')
  if (keyBuf.length !== hashBuf.length) return false
  return timingSafeEqual(hashBuf, keyBuf)
}
