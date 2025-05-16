import { AuthService } from "../../src/auth/auth.service";
import { MailerService } from "../../src/auth/email.service";
import { createIndexes, runDb } from "../../src/db/mongoDb";
import { testingDtosCreator, testSeeder } from "../test-helpers";
import { LoginDto } from "../../src/auth/auth.types";
import { JwtService } from "../../src/auth/jwt.service";
import { ISessionDb } from "../../src/security/session.types";
import { SessionsService } from "../../src/security/sessions.service";
import { container } from "../../src/ioc";
import { DeviceSessionModel } from "../../src/security/session.entity";
import { SETTINGS } from "../../src/settings/settings";
import { UserModel } from "../../src/users/user.entity";
import mongoose from "mongoose";

describe('sessions integration tests', () => {
  let sessionsService: SessionsService;
  let authService: AuthService;
  let jwtService: JwtService;

  const nodemailerService = {
    sendEmail: jest.fn().mockResolvedValue(true),
  } as unknown as MailerService;

  beforeAll(async () => {
    const res = await runDb()
    if (!res) {
      process.exit(1)
    }
    await DeviceSessionModel.db.dropCollection(SETTINGS.PATHS.SECURITY)
    await UserModel.db.dropCollection(SETTINGS.PATHS.USERS)
    await createIndexes()
    await container.unbind(MailerService)
    container.bind(MailerService).toConstantValue(nodemailerService);
    sessionsService = container.get(SessionsService);
    authService = container.get(AuthService)
    jwtService = container.get(JwtService)
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    await DeviceSessionModel.db.dropCollection(SETTINGS.PATHS.SECURITY)
    await UserModel.db.dropCollection(SETTINGS.PATHS.USERS)
    await createIndexes()
  })


  it('should create new sessions on every login', async () => {
    const { login, pass: password, email } = testingDtosCreator.createUserDto({});
    await testSeeder.createUsers([{ login, password, email }]);

    const loginDto: LoginDto = {
      loginOrEmail: login,
      password,
      ip: '1.1.1.1',
      title: 'chrome'
    }
    const tokens1 = await authService.checkCredentials(loginDto)
    expect(tokens1.refreshToken).toEqual(expect.any(String))
    const payload1 = jwtService.verifyRefreshToken(tokens1.refreshToken)

    await new Promise(res => setTimeout(res, 100));
    const tokens2 = await authService.checkCredentials(loginDto);
    const payload2 = jwtService.verifyRefreshToken(tokens2.refreshToken)

    const session1: ISessionDb = await DeviceSessionModel.findOne({ lastActiveDate: new Date(payload1!.iat) }) as ISessionDb
    expect(session1.lastActiveDate).toEqual(new Date(payload1!.iat))
    const sessionView: ISessionDb = await sessionsService.getSession(payload1?.deviceId!, payload1?.iat!)
    expect(sessionView?.lastActiveDate).toEqual(session1.lastActiveDate)

    const session2: ISessionDb = await DeviceSessionModel.findOne({ lastActiveDate: new Date(payload2!.iat) }) as ISessionDb
    expect(session2.lastActiveDate).toEqual(new Date(payload2!.iat))

    expect(session1.userId).toEqual(session2.userId);
    expect(session1._id).not.toEqual(session2._id)
  })

  it('should delete a session when logging user out', async () => {
    const { login, pass: password, email } = testingDtosCreator.createUserDto({});
    await testSeeder.createUsers([{ login, password, email }]);
    const loginDto: LoginDto = {
      loginOrEmail: login,
      password,
      ip: '1.1.1.1',
      title: 'chrome'
    }
    const tokens = await authService.checkCredentials(loginDto)
    const payload = jwtService.verifyRefreshToken(tokens.refreshToken)
    let session = await DeviceSessionModel.findOne({ lastActiveDate: new Date(payload!.iat) })
    expect(session).not.toBeNull()

    await sessionsService.logout(tokens.refreshToken);

    session = await DeviceSessionModel.findOne({ lastActiveDate: new Date(payload!.iat) })
    expect(session).toBeNull()
  })

  it.skip('token should be deleted from db when expired', async () => {
    // const userId = new ObjectId()
    // const token = new RefreshToken(userId.toString())
    // token.expiration = DateTime.utc().plus(Duration.fromMillis(500)).toJSDate()
    // await rTokensRepository.saveRefreshToken(token);
    //
    // //check it is in db
    // let dbEntry = await rTokensRepository.getRefreshToken(token.token)
    // expect(dbEntry).not.toBeNull()
    //
    // //mongo runs deletion job only once in 60 second, so have to wait long
    // //in order to check it
    // await new Promise(resolve => setTimeout(resolve, 65000))
    //
    // //check it is not in db
    // dbEntry = await rTokensRepository.getRefreshToken(token.token)
    // expect(dbEntry).toBeNull()
  }, 70000)
})
