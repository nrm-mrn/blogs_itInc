jest.mock("../../src/security/api/middleware/requestsLimiter.middleware", () =>
({
  requestsLimiter: (req: any, res: any, next: NextFunction) => next(),
}))
import { client, requestsCollection, runDb, usersCollection } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { createUser, loginUser, req, testingDtosCreator, UserDto } from "../test-helpers";
import { app } from "../../src/app";
import request from 'supertest';
import { HttpStatuses } from "../../src/shared/types/httpStatuses";
import { nodemailerService } from "../../src/auth/email.service";
import { IUserDb, IUserView } from "../../src/users/user.types";
import { usersRepository } from "../../src/users/users.repository";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { NextFunction } from "express";

describe('auth e2e tests', () => {

  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await usersCollection.drop()
  })

  beforeEach(async () => {
    await usersCollection.drop();
    await requestsCollection.drop();
  })

  afterAll(async () => {
    await client.close()
  })

  it('Should check user credentials and return tokens', async () => {
    const validUser: UserDto = {
      login: 'testUser',
      pass: 'qwerty123',
      email: 'test@gmail.com'
    }

    const validUser2: UserDto = {
      login: 'lg-996043',
      pass: 'qwerty1',
      email: 'test@yandex.ru'
    }
    await createUser(validUser);
    await createUser(validUser2);

    let res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.login, password: 'invalid' })
      .expect(401)
    await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.email, password: 'invalid' })
      .expect(401)
    await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: 'invalidLogin', password: validUser.pass })
      .expect(401)

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.login, password: validUser.pass })
      .expect(200)
    expect(res.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }))
    let cookies = res.headers['set-cookie'] as unknown as Array<string>;
    expect(cookies).toBeDefined()
    let authCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))
    expect(authCookie).toContain('HttpOnly')
    expect(authCookie?.startsWith('refreshToken='))

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.email, password: validUser.pass })
      .expect(200)
    expect(res.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }))
    cookies = res.headers['set-cookie'] as unknown as Array<string>;
    expect(cookies).toBeDefined()
    authCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))
    expect(authCookie).toContain('HttpOnly')
    expect(authCookie?.startsWith('refreshToken='))

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser2.login, password: validUser2.pass })
      .expect(200)
    expect(res.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }))
    cookies = res.headers['set-cookie'] as unknown as Array<string>;
    expect(cookies).toBeDefined()
    authCookie = cookies.find(cookie => cookie.startsWith('refreshToken='))
    expect(authCookie).toContain('HttpOnly')
    expect(authCookie?.startsWith('refreshToken='))
  },)

  it('Should get current user info', async () => {
    const userDto = testingDtosCreator.createUserDto({})
    await createUser();
    const { accessToken } = await loginUser();
    let res = await req.get(SETTINGS.PATHS.AUTH + '/me')
      .set({ 'authorization': 'Bearer ' + accessToken })
      .expect(200)
    expect(res.body.email).toEqual(userDto.email)
    expect(res.body.login).toEqual(userDto.login)

    await req.get(SETTINGS.PATHS.AUTH + '/me')
      .set({ 'authorization': 'Bearer ' + 'sdafsd2' })
      .expect(401)
  })

  it('Should reissue refresh token and set in cookie', async () => {
    const userDto = testingDtosCreator.createUserDto({})
    await createUser();
    let res = await req
      .post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: userDto.email, password: userDto.pass })
      .expect(200)
    let cookies = res.headers['set-cookie'] as unknown as Array<string>;
    const authCookie1: string = cookies.find(cookie => cookie.startsWith('refreshToken='))!
    const refreshToken1 = authCookie1.slice(0, authCookie1.indexOf(';'))
    const accessToken1 = res.body.accessToken

    //supertest persists cookies between requests, so need to use
    //fresh instanse to test for fails
    res = await request(app)
      .post(SETTINGS.PATHS.AUTH + '/refresh-token')
      .set('Cookie', 'refreshToken=sdfa234sfdinvalid')
      .expect(HttpStatuses.Unauthorized)

    res = await req
      .post(SETTINGS.PATHS.AUTH + '/refresh-token')
      .set('Cookie', refreshToken1)
      .expect(HttpStatuses.Success)
    cookies = res.headers['set-cookie'] as unknown as Array<string>;
    const authCookie2: string = cookies.find(cookie => cookie.startsWith('refreshToken='))!
    const refreshToken2 = authCookie2.slice(0, authCookie2.indexOf(';'))
    const accessToken2 = res.body.accessToken
    expect(refreshToken1).toEqual(expect.any(String))
    expect(refreshToken2).toEqual(expect.any(String))
    expect(accessToken1).toEqual(expect.any(String))
    expect(accessToken2).toEqual(expect.any(String))
    expect(refreshToken1).not.toEqual(refreshToken2)
  })

  it('should log out user', async () => {
    const userDto = testingDtosCreator.createUserDto({})
    await createUser();
    //need to send the request so that cookie is set
    await req
      .post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: userDto.email, password: userDto.pass })
      .expect(200)

    //check that we are logged in
    await req
      .post(SETTINGS.PATHS.AUTH + '/refresh-token')
      .expect(HttpStatuses.Success)

    await req
      .post(SETTINGS.PATHS.AUTH + '/logout')
      .expect(HttpStatuses.NoContent)

    await req
      .post(SETTINGS.PATHS.AUTH + '/refresh-token')
      .expect(HttpStatuses.Unauthorized)
  })


  describe('password recovery tests', () => {
    nodemailerService.sendEmail = jest
      .fn()
      .mockImplementation(
        (email: string, template: string) =>
          Promise.resolve(true)
      );

    beforeEach(async () => {
      await usersCollection.drop();
      await requestsCollection.drop();
    })

    it('should reset a password', async () => {
      const userDto = testingDtosCreator.createUserDto({})
      const user: IUserView = await createUser();

      await req
        .post(SETTINGS.PATHS.AUTH + '/password-recovery')
        .send({ email: 'invalidemail' })
        .expect(HttpStatuses.BadRequest)
      expect(nodemailerService.sendEmail).not.toHaveBeenCalled()

      await req
        .post(SETTINGS.PATHS.AUTH + '/password-recovery')
        .send({ email: 'nonexistent@gmail.com' })
        .expect(HttpStatuses.NoContent)
      let userDb: IUserDb | null = await usersRepository.getUserById(new ObjectId(user.id))
      expect(userDb).not.toBeNull()
      expect(userDb?.passwordRecovery).toBeNull()
      expect(nodemailerService.sendEmail).not.toHaveBeenCalled()

      await req
        .post(SETTINGS.PATHS.AUTH + '/password-recovery')
        .send({ email: userDto.email })
        .expect(HttpStatuses.NoContent)
      userDb = await usersRepository.getUserById(new ObjectId(user.id))
      expect(nodemailerService.sendEmail).toHaveBeenCalled()
      expect(nodemailerService.sendEmail).toHaveBeenCalledTimes(1)
      expect(userDb?.passwordRecovery).not.toBeNull()
      expect(userDb?.passwordRecovery?.confirmationCode).toEqual(expect.any(String))
      const recCode = userDb?.passwordRecovery?.confirmationCode

      const invalidCode = 'safasf23'
      const fakeCode = randomUUID();
      await req
        .post(SETTINGS.PATHS.AUTH + '/new-password')
        .send({ newPassword: 'newpass', recoveryCode: invalidCode })
        .expect(HttpStatuses.BadRequest)
      await req
        .post(SETTINGS.PATHS.AUTH + '/new-password')
        .send({ newPassword: 'newpass', recoveryCode: fakeCode })
        .expect(HttpStatuses.BadRequest)

      await req
        .post(SETTINGS.PATHS.AUTH + '/new-password')
        .send({ newPassword: 'newpass', recoveryCode: recCode })
        .expect(HttpStatuses.NoContent)

      //old pass should not work
      await req
        .post(SETTINGS.PATHS.AUTH + '/login')
        .send({ loginOrEmail: userDto.email, password: userDto.pass })
        .expect(HttpStatuses.Unauthorized)

      await req
        .post(SETTINGS.PATHS.AUTH + '/login')
        .send({ loginOrEmail: userDto.email, password: 'newpass' })
        .expect(HttpStatuses.Success)


      //code should be deleted after use
      await req
        .post(SETTINGS.PATHS.AUTH + '/new-password')
        .send({ newPassword: 'newpass123', recoveryCode: recCode })
        .expect(HttpStatuses.BadRequest)
    })
  })
})
