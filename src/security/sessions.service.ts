import { ObjectId } from "../shared/types/objectId.type";
import { SessionsRepository } from "./sessions.repository";
import { DeviceAuthSession, DeviceSessionModel, SessionDocument } from "./session.entity";
import { CreateSessionDto } from "./session.types";
import { JwtService } from "../auth/jwt.service";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { inject, injectable } from "inversify";
import mongoose from "mongoose";

@injectable()
export class SessionsService {

  constructor(
    @inject(SessionsRepository)
    private readonly sessionsRepository: SessionsRepository,
    @inject(JwtService)
    private readonly jwtService: JwtService,
  ) { }

  async saveSession(input: CreateSessionDto): Promise<ObjectId> {
    const sessionInst = new DeviceAuthSession(
      new mongoose.Types.ObjectId(input.deviceId),
      input.userId,
      input.iat,
      input.ip,
      input.title,
    )
    const session = new DeviceSessionModel({
      ...sessionInst
    })

    return this.sessionsRepository.save(session);
  }

  async getSession(deviceId: string, iat: number): Promise<SessionDocument> {
    const lastActiveDate = new Date(iat)
    const session = await this.sessionsRepository.getSession(
      new mongoose.Types.ObjectId(deviceId),
      lastActiveDate);
    return session
  }

  async refreshSession(deviceId: string, iat: number): Promise<void> {
    const session = await this.sessionsRepository.findSessionByDeviceId(new mongoose.Types.ObjectId(deviceId))
    if (!session) {
      throw new Error('Unable to find a session for refresh')
    }
    const lastActiveDate = new Date(iat)
    session.lastActiveDate = lastActiveDate
    await this.sessionsRepository.save(session)
    return
  }

  async logout(token: string): Promise<void> {
    const payload = this.jwtService.verifyRefreshToken(token)!
    //NOTE: check that refresh token session is active
    const lastActiveDate = new Date(payload.iat)
    const session = await this.sessionsRepository
      .getSession(
        new mongoose.Types.ObjectId(payload.deviceId),
        lastActiveDate);
    return this.sessionsRepository.deleteSession(session);
  }

  async deleteAnotherSession(token: string, deviceToDelete: string): Promise<void> {
    const payload = this.jwtService.verifyRefreshToken(token)!;
    const deviceId = new mongoose.Types.ObjectId(payload.deviceId)

    //NOTE: check that refresh token session is active
    const lastActiveDate = new Date(payload.iat)
    const session = await this.sessionsRepository
      .getSession(deviceId, lastActiveDate);
    //NOTE: check that userId is the same in token and in the deviceToDelete
    const targetDeviceId = new mongoose.Types.ObjectId(deviceToDelete);
    const targetSession = await this.sessionsRepository.findSessionByDeviceId(targetDeviceId)
    if (!targetSession) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.NotFound)
    }
    if (targetSession.userId !== session.userId) {
      throw new CustomError('Could not delete session of another user', HttpStatuses.Forbidden)
    }
    return this.sessionsRepository.deleteSession(targetSession);
  }

  async deleteOtherSessions(token: string): Promise<void> {
    const payload = this.jwtService.verifyRefreshToken(token)!
    const deviceId = new mongoose.Types.ObjectId(payload.deviceId)
    const lastActiveDate = new Date(payload.iat)

    await this.sessionsRepository
      .getSession(deviceId, lastActiveDate);
    return this.sessionsRepository.deleteOtherSessions(
      lastActiveDate,
      payload.userId,
    );
  }
}
