import { runDb } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { registerUser, testingDtosCreator, UserDto } from "../test-helpers";
import { createApp } from "../../src/app";
import request, { agent } from 'supertest';
import { HttpStatuses } from "../../src/shared/types/httpStatuses";
import { AuthSuccess, LoginBody } from "../../src/auth/auth.types";
import { IDeviceView } from "../../src/security/session.types";
import { JwtService } from "../../src/auth/jwt.service";
import { ObjectId } from "mongodb";
import { SessionsQueryRepository } from "../../src/security/sessions.queryRepository";
import { container } from "../../src/ioc";
import { UserModel } from "../../src/users/user.entity";
import { ApiReqModel } from "../../src/security/apiRequest.entity";
import mongoose from "mongoose";
import { ApiRequestService } from "../../src/security/apiRequest.service";
import { MailerService } from "../../src/auth/email.service";
import { DeviceSessionModel, SessionDocument } from "../../src/security/session.entity";

describe('sessions e2e tests', () => {
  let sessionsQueryRepo: SessionsQueryRepository;
  let jwtService: JwtService;
  let app: any;
  let req: any

  beforeAll(async () => {
    const res = await runDb()
    if (!res) {
      process.exit(1)
    }
    await UserModel.db.dropCollection(SETTINGS.PATHS.USERS)
    await ApiReqModel.db.dropCollection(SETTINGS.PATHS.REQUESTS)
    sessionsQueryRepo = container.get(SessionsQueryRepository);
    jwtService = container.get(JwtService)
    app = createApp();
    req = agent(app);
    jest.spyOn(ApiRequestService.prototype, 'getDocsCountForPeriod').mockImplementation(() => Promise.resolve(1))
    jest.spyOn(MailerService.prototype, 'sendEmail').mockImplementation(() => Promise.resolve(true))
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  let device1tokens: AuthSuccess
  let device2tokens: AuthSuccess
  let device3tokens: AuthSuccess
  let device4tokens: AuthSuccess
  let oldDev1Tokens: AuthSuccess
  it('Should login 4 devices for a user', async () => {
    const validUser: UserDto = testingDtosCreator.createUserDto({})
    await registerUser(req, validUser);
    const loginBody: LoginBody = {
      loginOrEmail: validUser.login,
      password: validUser.pass,
    }

    let res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .set('User-Agent', 'safari')
      .send(loginBody)
      .expect(200)
    let cookies = res.headers['set-cookie'] as unknown as Array<string>;
    let authCookie: string = cookies.find(cookie => cookie.startsWith('refreshToken='))!
    const refreshToken1 = authCookie.slice(
      authCookie.indexOf('=') + 1, authCookie.indexOf(';'))
    device1tokens = { ...res.body, refreshToken: refreshToken1 }

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .set('User-Agent', 'chrome')
      .send(loginBody)
      .expect(200)
    cookies = res.headers['set-cookie'] as unknown as Array<string>;
    authCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))!
    const refreshToken2 = authCookie.slice(
      authCookie.indexOf('=') + 1, authCookie.indexOf(';'))
    device2tokens = { ...res.body, refreshToken: refreshToken2 }

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .set('User-Agent', 'ie')
      .send(loginBody)
      .expect(200)
    cookies = res.headers['set-cookie'] as unknown as Array<string>;
    authCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))!
    const refreshToken3 = authCookie.slice(
      authCookie.indexOf('=') + 1, authCookie.indexOf(';'))
    device3tokens = { ...res.body, refreshToken: refreshToken3 }

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .set('User-Agent', 'chrome mobile')
      .send(loginBody)
      .expect(200)
    cookies = res.headers['set-cookie'] as unknown as Array<string>;
    authCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))!
    const refreshToken4 = authCookie.slice(
      authCookie.indexOf('=') + 1, authCookie.indexOf(';'))
    device4tokens = { ...res.body, refreshToken: refreshToken4 }
  }
  )

  it('Should refresh token for device 1', async () => {
    oldDev1Tokens = { ...device1tokens };
    //get all current sessions
    let res = await request(app)
      .get(SETTINGS.PATHS.SECURITY + '/devices')
      .set('Cookie', `refreshToken=${device1tokens.refreshToken}`)
      .expect(HttpStatuses.Success)
    const oldSessions: IDeviceView[] = res.body
    expect(oldSessions.length).toEqual(4)

    //refresh token for device 1
    res = await request(app)
      .post(SETTINGS.PATHS.AUTH + '/refresh-token')
      .set('Cookie', `refreshToken=${device1tokens.refreshToken}`)
      .expect(HttpStatuses.Success)
    let cookies = res.headers['set-cookie'] as unknown as Array<string>;
    let authCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))!
    const newRefreshToken1 = authCookie.slice(
      authCookie.indexOf('=') + 1, authCookie.indexOf(';'))
    device1tokens = { ...res.body, refreshToken: newRefreshToken1 }

    //should fail with old token now
    res = await request(app)
      .post(SETTINGS.PATHS.AUTH + '/refresh-token')
      .set('Cookie', `refreshToken=${oldDev1Tokens.refreshToken}`)
      .expect(HttpStatuses.Unauthorized)

    //get updated sessions
    res = await request(app)
      .get(SETTINGS.PATHS.SECURITY + '/devices')
      .set('Cookie', `refreshToken=${device1tokens.refreshToken}`)
      .expect(HttpStatuses.Success)
    const newSessions: IDeviceView[] = res.body
    expect(newSessions.length).toEqual(4)
    expect(oldSessions.map(session => session.deviceId))
      .toEqual(newSessions.map(session => session.deviceId))

    expect(oldSessions.map(session => session.lastActiveDate))
      .not.toEqual(newSessions.map(session => session.lastActiveDate))
  })

  it('Should delete device session', async () => {
    const dev2payload = jwtService.verifyRefreshToken(device2tokens.refreshToken)!
    //invalid deviceId
    let res = await request(app)
      .delete(SETTINGS.PATHS.SECURITY + `/devices/sdf2342`)
      .set('Cookie', `refreshToken=${device1tokens.refreshToken}`)
      .expect(HttpStatuses.BadRequest)
    let sessions = await sessionsQueryRepo.getSessions(dev2payload?.userId);
    expect(sessions?.length).toEqual(4)

    //fake device id
    const fakeId = new ObjectId();
    res = await request(app)
      .delete(SETTINGS.PATHS.SECURITY + `/devices/${fakeId}`)
      .set('Cookie', `refreshToken=${device1tokens.refreshToken}`)
      .expect(HttpStatuses.NotFound)
    sessions = await sessionsQueryRepo.getSessions(dev2payload?.userId);
    expect(sessions?.length).toEqual(4)

    //old revoked token
    res = await request(app)
      .delete(SETTINGS.PATHS.SECURITY + `/devices/${dev2payload?.deviceId}`)
      .set('Cookie', `refreshToken=${oldDev1Tokens.refreshToken}`)
      .expect(HttpStatuses.Unauthorized)
    sessions = await sessionsQueryRepo.getSessions(dev2payload?.userId);
    expect(sessions?.length).toEqual(4)


    res = await request(app)
      .delete(SETTINGS.PATHS.SECURITY + `/devices/${dev2payload?.deviceId}`)
      .set('Cookie', `refreshToken=${device1tokens.refreshToken}`)
      .expect(HttpStatuses.NoContent)
    sessions = await sessionsQueryRepo.getSessions(dev2payload?.userId);
    expect(sessions?.length).toEqual(3)
    expect(sessions!.map(session => session.deviceId)).not.toContain(dev2payload.deviceId)
  })

  it('should log out a device', async () => {
    const dev3payload = jwtService.verifyRefreshToken(device3tokens.refreshToken)!;

    //non-existent session
    await request(app)
      .post(SETTINGS.PATHS.AUTH + '/logout')
      .set('Cookie', `refreshToken=${device2tokens.refreshToken}`)
      .expect(HttpStatuses.Unauthorized)

    await request(app)
      .post(SETTINGS.PATHS.AUTH + '/logout')
      .set('Cookie', `refreshToken=${device3tokens.refreshToken}`)
      .expect(HttpStatuses.NoContent)

    const sessions = await DeviceSessionModel.find({}).lean() as SessionDocument[];
    expect(sessions?.length).toEqual(2)
    expect(sessions!.map(session => session._id)).not.toContain(dev3payload.deviceId)
  })

  it('should log out all but current devices', async () => {
    const dev1payload = jwtService.verifyRefreshToken(device1tokens.refreshToken)!

    //non-existent session
    await request(app)
      .delete(SETTINGS.PATHS.SECURITY + '/devices')
      .set('Cookie', `refreshToken=${device3tokens.refreshToken}`)
      .expect(HttpStatuses.Unauthorized)

    await request(app)
      .delete(SETTINGS.PATHS.SECURITY + '/devices')
      .set('Cookie', `refreshToken=${device1tokens.refreshToken}`)
      .expect(HttpStatuses.NoContent)

    const sessions = await DeviceSessionModel.find({}).lean() as SessionDocument[];
    expect(sessions?.length).toEqual(1)
    expect(sessions[0]._id.toString()).toEqual(dev1payload.deviceId)
  })
})
