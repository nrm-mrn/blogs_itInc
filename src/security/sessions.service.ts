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

  async getSession(deviceId: string, iat: number): Promise<ISessionDb | null> {
    const lastActiveDate = new Date(Number(iat)).toISOString();
    return sessionsRepository.getSession(new ObjectId(deviceId), lastActiveDate);
  },

  async refreshSession(deviceId: string, iat: number): Promise<void> {
    const lastActiveDate = new Date(Number(iat)).toISOString();
    return sessionsRepository.refreshSession(
      new ObjectId(deviceId),
      lastActiveDate,
    )
  },

  async logout(token: string): Promise<void> {
    const payload = jwtService.verifyRefreshToken(token)!
    //NOTE: check that refresh token session is active
    const lastActiveDate = new Date(payload.iat).toISOString();
    const session = await sessionsRepository
      .getSession(new ObjectId(payload.deviceId), lastActiveDate);
    if (!session) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
    }
    return sessionsRepository.deleteSession(lastActiveDate);
  },

  async deleteAnotherSession(token: string, deviceToDelete: string): Promise<void> {
    const payload = jwtService.verifyRefreshToken(token)!;
    const deviceId = new ObjectId(payload.deviceId)

    //NOTE: check that refresh token session is active
    const lastActiveDate = new Date(payload.iat).toISOString();
    const session = await sessionsRepository
      .getSession(deviceId, lastActiveDate);
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
    const lastActiveDate = new Date(payload.iat).toISOString();

    const session = await sessionsRepository
      .getSession(deviceId, lastActiveDate);
    if (!session) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
    }
    return sessionsRepository.deleteOtherSessions(
      lastActiveDate,
      payload.userId,
    );
  }
}
