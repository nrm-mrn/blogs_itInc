import { client, runDb, usersCollection } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { createUser, loginUser, req, testingDtosCreator, UserDto } from "../test-helpers";
import { app } from "../../src/app";
import request from 'supertest';
import { HttpStatuses } from "../../src/shared/types/httpStatuses";

describe('auth tests', () => {

  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await usersCollection.drop()
  })

  beforeEach(async () => {
    await usersCollection.drop()
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
  })

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
})
