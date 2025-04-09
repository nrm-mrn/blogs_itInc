import jwt, { Secret } from 'jsonwebtoken'
import { SETTINGS } from '../settings/settings'

export const jwtService = {
  createToken(userId: string): string {
    const secret: Secret = Buffer.from(SETTINGS.JWT_SECRET)
    return jwt.sign({ userId }, secret, { expiresIn: SETTINGS.JWT_TIME })
  },

  decodeToken(token: string) {
    try {
      return jwt.decode(token)
    } catch (e) {
      console.error('Could not decode token', e);
      return null
    }
  },

  verifyToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, Buffer.from(SETTINGS.JWT_SECRET)) as { userId: string };
    } catch (err) {
      return null
    }
  }
}
