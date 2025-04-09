import { client, runDb, usersCollection } from "../src/db/mongoDb";
import { SETTINGS } from "../src/settings/settings";
import { createUser, loginUser, req, testingDtosCreator, UserDto } from "./test-helpers";

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

  it('Should check user credentials', async () => {
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
    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.email, password: 'invalid' })
      .expect(401)
    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: 'invalidLogin', password: validUser.pass })
      .expect(401)
    '/blogs'
    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.login, password: validUser.pass })
      .expect(200)
    expect(res.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }))

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.email, password: validUser.pass })
      .expect(200)
    expect(res.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }))

    res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser2.login, password: validUser2.pass })
      .expect(200)
    expect(res.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }))
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
})
