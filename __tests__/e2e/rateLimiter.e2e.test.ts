import { createApp } from "../../src/app";
import { client, requestsCollection, runDb, sessionsCollection, usersCollection } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { UserDto } from "../test-helpers";
import { agent, Test } from 'supertest';

describe('rate limiter tests', () => {
  let app: any;
  let req: any

  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await usersCollection.drop()
    await sessionsCollection.drop()
    await requestsCollection.drop()
    app = createApp();
    req = agent(app);
  })

  afterAll(async () => {
    await requestsCollection.drop()
    await client.close()
  })

  it('should save requests to db and enforce limits', async () => {
    const validUser: UserDto = {
      login: 'testUser',
      pass: 'qwerty123',
      email: 'test@gmail.com'
    }

    const results: Test[] = [];
    for (let i = 0; i < 6; i++) {
      let res = req.post(SETTINGS.PATHS.AUTH + '/login')
        .send({ loginOrEmail: validUser.login, password: 'invalid' })
      results.push(res)
    }

    await Promise.all(results);

    for (let i = 0; i < 6; i++) {
      if (i < 4) {
        results[i].expect(401);
      }
      if (i === 5) {
        results[i].expect(429);
      }
    }

    //check that new requests will not be added to db until limiter resets
    const count = await requestsCollection.countDocuments({});
    await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.login, password: 'invalid' })
      .expect(429)

    const newCount = await requestsCollection.countDocuments({});
    expect(newCount).toEqual(count)

    //wait for timeout
    await new Promise(res => setTimeout(res, 11000))

    //now requests should go through again
    let res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.login, password: 'invalid' })
      .expect(401)
  }, 15000)
})
