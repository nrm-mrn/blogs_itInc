import { ObjectId } from "mongodb";
import { sessionsRepository } from "./sessions.repository"
import { DeviceAuthSession } from "./session.entity";
import { CreateSessionDto, ISessionDb } from "./session.types";
import { jwtService } from "../auth/jwt.service";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";

export const sessionsService = {
  async saveSession(input: CreateSessionDto): Promise<ObjectId> {
    const session = new DeviceAuthSession(
      new ObjectId(input.deviceId),
      input.userId,
      input.iat,
      input.ip,
      input.title,
    )
    return sessionsRepository.saveSession(session);
  },

  async getSession(deviceId: string, iat: string): Promise<ISessionDb | null> {
    return sessionsRepository.getSession(new ObjectId(deviceId), iat);
  },

  async refreshSession(deviceId: string, iat: string): Promise<void> {
    return sessionsRepository.refreshSession(
      new ObjectId(deviceId),
      iat,
    )
  },

  async logout(token: string): Promise<void> {
    const payload = jwtService.verifyRefreshToken(token)!
    //NOTE: check that refresh token session is active
    const session = await sessionsRepository
      .getSession(new ObjectId(payload.deviceId), payload.iat);
    if (!session) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
    }
    return sessionsRepository.deleteSession(payload.iat);
  },

  async deleteAnotherSession(token: string, deviceToDelete: string): Promise<void> {
    const payload = jwtService.verifyRefreshToken(token)!;
    const iat = payload.iat
    const deviceId = new ObjectId(payload.deviceId)

    //NOTE: check that refresh token session is active
    const session = await sessionsRepository
      .getSession(deviceId, iat);
    if (!session) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
    }
    //NOTE: check that userId is the same in token and in the deviceToDelete
    const targetDeviceId = new ObjectId(deviceToDelete);
    const targetSession = await sessionsRepository.getSessionByDeviceId(targetDeviceId)
    if (!targetSession) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.NotFound)
    }
    if (targetSession.userId !== session.userId) {
      throw new CustomError('Could not delete session of another user', HttpStatuses.Forbidden)
    }
    return sessionsRepository.deleteSession(targetSession.lastActiveDate);
  },

  async deleteOtherSessions(token: string): Promise<void> {
    const payload = jwtService.verifyRefreshToken(token)!
    const deviceId = new ObjectId(payload.deviceId)

    const session = await sessionsRepository
      .getSession(deviceId, payload.iat);
    if (!session) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
    }
    return sessionsRepository.deleteOtherSessions(
      payload.iat,
      payload.userId,
    );
  }
}
