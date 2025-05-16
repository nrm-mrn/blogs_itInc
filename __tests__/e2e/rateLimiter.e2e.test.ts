import mongoose from "mongoose";
import { createApp } from "../../src/app";
import { runDb } from "../../src/db/mongoDb";
import { ApiReqModel } from "../../src/security/apiRequest.entity";
import { SETTINGS } from "../../src/settings/settings";
import { UserDto } from "../test-helpers";
import { agent, Test } from 'supertest';

describe('rate limiter tests', () => {
  let app: any;
  let req: any

  beforeAll(async () => {
    const res = await runDb()
    if (!res) {
      process.exit(1)
    }
    await ApiReqModel.db.dropCollection(SETTINGS.PATHS.REQUESTS)
    app = createApp();
    req = agent(app);
  })

  afterAll(async () => {
    await ApiReqModel.db.dropCollection(SETTINGS.PATHS.REQUESTS)
    await mongoose.connection.close()
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
    const count = await ApiReqModel.countDocuments({}).exec()
    await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.login, password: 'invalid' })
      .expect(429)

    const newCount = await ApiReqModel.countDocuments({}).exec()
    expect(newCount).toEqual(count)

    //wait for timeout
    await new Promise(res => setTimeout(res, 11000))

    //now requests should go through again
    let res = await req.post(SETTINGS.PATHS.AUTH + '/login')
      .send({ loginOrEmail: validUser.login, password: 'invalid' })
      .expect(401)
  }, 15000)
})
