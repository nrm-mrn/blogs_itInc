import { ObjectId } from "mongodb";
import { authService } from "../../src/auth/auth.service";
import { nodemailerService } from "../../src/auth/email.service";
import { client, createIndexes, runDb, sessionsCollection, usersCollection } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { createUser, insertUser, testingDtosCreator } from "../test-helpers";
import { User } from "../../src/users/user.entity";
import { DateTime } from "luxon";
import { LoginDto } from "../../src/auth/auth.types";
import { jwtService } from "../../src/auth/jwt.service";
import { IDeviceView, ISessionDb } from "../../src/security/session.types";
import { sessionsService } from "../../src/security/sessions.service";

describe('sessions integration tests', () => {
  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await sessionsCollection.drop()
    await usersCollection.drop()
    await createIndexes()
  })

  afterAll(async () => {
    await client.close()
  })

  beforeEach(async () => {
    await sessionsCollection.drop()
    await usersCollection.drop()
    await createIndexes()
  })

  nodemailerService.sendEmail = jest
    .fn()
    .mockImplementation(
      (email: string, template: string) =>
        Promise.resolve(true)
    );

  it('should create new sessions on every login', async () => {
    const { login, pass, email } = testingDtosCreator.createUserDto({});
    await createUser();
    const loginDto: LoginDto = {
      loginOrEmail: login,
      password: pass,
      ip: '1.1.1.1',
      title: 'chrome'
    }
    const tokens1 = await authService.checkCredentials(loginDto)
    expect(tokens1.refreshToken).toEqual(expect.any(String))
    const payload1 = jwtService.verifyRefreshToken(tokens1.refreshToken)

    await new Promise(res => setTimeout(res, 100));
    const tokens2 = await authService.checkCredentials(loginDto);
    const payload2 = jwtService.verifyRefreshToken(tokens2.refreshToken)

    const session1: ISessionDb = await sessionsCollection.findOne({ lastActiveDate: payload1?.iat }) as ISessionDb
    expect(session1.lastActiveDate).toEqual(payload1?.iat)
    const sessionView: ISessionDb | null = await sessionsService.getSession(payload1?.deviceId!, payload1?.iat!)
    expect(sessionView?.lastActiveDate).toEqual(session1.lastActiveDate)

    const session2: ISessionDb = await sessionsCollection.findOne({ lastActiveDate: payload2?.iat }) as ISessionDb
    expect(session2.lastActiveDate).toEqual(payload2?.iat)

    expect(session1.userId).toEqual(session2.userId);
    expect(session1._id).not.toEqual(session2._id)
  })

  it('should delete a session when logging user out', async () => {
    const { login, pass, email } = testingDtosCreator.createUserDto({});
    await createUser();
    const loginDto: LoginDto = {
      loginOrEmail: login,
      password: pass,
      ip: '1.1.1.1',
      title: 'chrome'
    }
    const tokens = await authService.checkCredentials(loginDto)
    const payload = jwtService.verifyRefreshToken(tokens.refreshToken)
    let session = await sessionsCollection.findOne({ lastActiveDate: payload?.iat })
    expect(session).not.toBeNull()

    await sessionsService.logout(tokens.refreshToken);

    session = await sessionsCollection.findOne({ lastActiveDate: payload?.iat })
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
