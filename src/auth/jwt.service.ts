import jwt, { Secret } from 'jsonwebtoken'
import { SETTINGS } from '../settings/settings'
import { randomUUID } from 'crypto'

export const jwtService = {
  createAccessToken(userId: string): string {
    const secret: Secret = Buffer.from(SETTINGS.JWT_SECRET)
    return jwt.sign({ userId }, secret, { expiresIn: `${SETTINGS.JWT_TIME}ms` })
  },

  createRefreshToken(userId: string): string {
    const secret: Secret = Buffer.from(SETTINGS.JWT_SECRET)
    const jti = this.generateUUID()
    return jwt.sign({ userId, jti }, secret, { expiresIn: `${SETTINGS.REFRESHT_TIME}ms` })
  },

  generateUUID(): string {
    return randomUUID()
  },

  decodeToken(token: string) {
    try {
      return jwt.decode(token)
    } catch (e) {
      console.error('Could not decode token', e);
      return null
    }
  },

  verifyAccessToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, Buffer.from(SETTINGS.JWT_SECRET)) as { userId: string };
    } catch (err) {
      return null
    }
  },

  verifyRefreshToken(token: string): { userId: string, jti: string } | null {
    try {
      return jwt.verify(token, Buffer.from(SETTINGS.JWT_SECRET)) as { userId: string, jti: string };
    } catch (err) {
      return null
    }
  }
}
