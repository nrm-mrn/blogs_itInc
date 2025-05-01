import jwt, { Secret } from 'jsonwebtoken'
import { SETTINGS } from '../settings/settings'
import { CreateRefreshTokenDto, RTokenPayload } from './auth.types'

export const jwtService = {
  createAccessToken(userId: string): string {
    const secret: Secret = Buffer.from(SETTINGS.JWT_SECRET)
    return jwt.sign({ userId }, secret, { expiresIn: `${SETTINGS.JWT_TIME}ms` })
  },

  createRefreshToken(input: CreateRefreshTokenDto): { token: string, iat: string } {
    const secret: Secret = Buffer.from(SETTINGS.JWT_SECRET)
    const iat = Date.now()
    const token = jwt.sign({ iat, ...input }, secret, { expiresIn: `${SETTINGS.REFRESHT_TIME}ms` })
    return { token, iat: iat.toString() }
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

  verifyRefreshToken(token: string): RTokenPayload | null {
    try {
      const payload = jwt.verify(token, Buffer.from(SETTINGS.JWT_SECRET)) as {
        deviceId: string,
        userId: string,
        iat: number,
      }
      return {
        deviceId: payload.deviceId,
        userId: payload.userId,
        iat: payload.iat.toString(),
      }
    } catch (err) {
      return null
    }
  }
}
