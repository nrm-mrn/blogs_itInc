import { db, setDb } from "../src/db/db"
import { BlogInputModel } from "../src/db/db-types";
import { SETTINGS } from "../src/settings/settings";
import { req } from "./test-helpers";

describe('blogs routes tests', () => {

  let buff;
  let codedAuth: string;
  beforeAll(async () => {
    setDb();
    buff = Buffer.from(db.users[0].auth);
    codedAuth = buff.toString('base64')
  })


  it('Should get 200 and an empty array', async () => {

    const res = await req.get(SETTINGS.PATHS.BLOGS).expect(200)
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);

  })

  it('Should create blogs', async () => {
    const validBlog: BlogInputModel = {
      name: 'First blog',
      description: 'some description of the first blog',
      websiteUrl: 'https://google.com'
    }
    let res = await req.post(SETTINGS.PATHS.BLOGS).send(validBlog).expect(401)

    res = await req.post(SETTINGS.PATHS.BLOGS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validBlog)
      .expect(201)
    expect(res.body.id).toEqual(expect.any(String))
    expect(res.body.name).toEqual(validBlog.name)
    expect(res.body.description).toEqual(validBlog.description)
    expect(res.body.websiteUrl).toEqual(validBlog.websiteUrl)
  })

  it('Should get validation errors on update', async () => {
    const validBlog: BlogInputModel = {
      name: 'First blog',
      description: 'some description of the first blog',
      websiteUrl: 'https://google.com'
    }

    const valid_res = await req.post(SETTINGS.PATHS.BLOGS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validBlog)
      .expect(201)

    const invalidBlog: BlogInputModel = {
      name: 'some invalid too long name',
      description: 'valid descr',
      websiteUrl: 'invalid',
    }
    const res = await req.put(SETTINGS.PATHS.BLOGS + `/${valid_res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(invalidBlog)
      .expect(400)
    expect(res.body.errorsMessages.length).toBe(2)
  })

  it('Should update a blog', async () => {
    const validBlog: BlogInputModel = {
      name: 'BlogToUpd',
      description: 'some description of the updateable blog',
      websiteUrl: 'https://google.com'
    }

    const blogObj = await req.post(SETTINGS.PATHS.BLOGS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validBlog)
      .expect(201)

    const update: BlogInputModel = {
      name: 'Updated',
      description: 'New one',
      websiteUrl: 'https://google.com/test',
    }
    let res = await req.put(SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(update)
      .expect(204)

    res = await req.get(SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
      .expect(200)
    expect(res.body.id).toEqual(blogObj.body.id)
    expect(res.body.name).toEqual(update.name)
    expect(res.body.description).toEqual(update.description)
    expect(res.body.websiteUrl).toEqual(update.websiteUrl)
  })

  it('Should get blogs', async () => {
    const res = await req.get(SETTINGS.PATHS.BLOGS).expect(200)
    expect(res.body.length).toBe(3);
  })

  it('Should delete a blog', async () => {
    const validBlog: BlogInputModel = {
      name: 'Blog to del',
      description: 'some description of the updateable blog',
      websiteUrl: 'https://google.com'
    }

    const blogObj = await req.post(SETTINGS.PATHS.BLOGS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validBlog)
      .expect(201)

    await req.delete(SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
      .expect(401)

    await req.delete(SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .expect(204)

    await req.get(SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
      .expect(404)
  })



})
