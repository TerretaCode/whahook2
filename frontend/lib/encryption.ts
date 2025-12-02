/**
 * Encryption utilities for sensitive data (SMTP passwords, etc.)
 * Uses AES-256-GCM for authenticated encryption
 * 
 * NOTE: This runs on the server side only (API routes)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

/**
 * Get encryption key from environment variable
 * Key should be 32 bytes (256 bits) hex encoded
 */
function getEncryptionKey(): Buffer {
  const key = process.env.SMTP_ENCRYPTION_KEY
  if (!key) {
    throw new Error('SMTP_ENCRYPTION_KEY environment variable is not set')
  }
  
  // If key is hex encoded (64 chars = 32 bytes)
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  
  // Otherwise derive key from passphrase using PBKDF2
  const salt = Buffer.from('whahook-smtp-salt', 'utf8')
  return crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256')
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: salt:iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Combine salt:iv:authTag:encrypted as base64
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ])
  
  return combined.toString('base64')
}

/**
 * Decrypt a string value
 * Expects base64 encoded string from encrypt()
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()
  
  const combined = Buffer.from(encryptedData, 'base64')
  
  // Extract components
  const _salt = combined.subarray(0, SALT_LENGTH) // Salt is included for future key derivation
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Check if a value is encrypted (basic check)
 */
export function isEncrypted(value: string): boolean {
  try {
    const decoded = Buffer.from(value, 'base64')
    // Minimum length: salt(32) + iv(16) + authTag(16) + at least 1 byte of data
    return decoded.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1
  } catch {
    return false
  }
}

/**
 * Generate a random encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}
