import { BlogInputModel, BlogPostInputModel, BlogViewModel, PostViewModel } from "../src/db/db-types";
import { blogsCollection, client, postsCollection, runDb } from "../src/db/mongoDb";
import { blogService } from "../src/domain/blogs.service";
import { SETTINGS } from "../src/settings/settings";
import { GetBlogsQuery, PagedResponse, PagingParams, SortDirection } from "../src/shared/types";
import { req } from "./test-helpers";

describe('blogs routes tests', () => {

  let buff;
  let codedAuth: string;
  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await blogsCollection.drop()
    await postsCollection.drop()
    buff = Buffer.from(SETTINGS.SUPERUSER!);
    codedAuth = buff.toString('base64')
  })

  afterAll(async () => {
    await client.close()
  })


  it('Should get 200 and an empty array', async () => {

    const res = await req.get(SETTINGS.PATHS.BLOGS).expect(200)
    const blogsPage: PagedResponse<BlogViewModel> = res.body
    expect(Array.isArray(blogsPage.items)).toBe(true);
    expect(blogsPage.items.length).toBe(0);

  })

  it('Should create blogs', async () => {
    const validBlog: BlogInputModel = {
      name: 'First blog',
      description: 'some description of the first blog',
      websiteUrl: 'https://google.com',

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
      name: 'First blog upd',
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
    expect(res.body.items.length).toBe(3);
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

  it('Should create a post for specified blog', async () => {
    const validBlog: BlogInputModel = {
      name: 'Bl for posts',
      description: 'some description of the updateable blog',
      websiteUrl: 'https://google.com'
    }

    let res = await req.post(SETTINGS.PATHS.BLOGS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validBlog)
      .expect(201)
    const blogObj: BlogViewModel = res.body

    const postInput: BlogPostInputModel = {
      title: 'post for bl',
      shortDescription: 'test short dec',
      content: 'some test c'
    }
    res = await req.post(SETTINGS.PATHS.BLOGS + `/${blogObj.id}/posts`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(postInput)
      .expect(201)
    const postObj: PostViewModel = res.body

    expect(postObj.title).toEqual(postInput.title)
    expect(postObj.blogId).toEqual(blogObj.id)
  })

  it('Test pagination', async () => {
    await blogsCollection.drop();
    const sampleBlog =
    {
      name: 'first',
      description: 'first blog desc',
      websiteUrl: 'https://google.com'
    }
    const total = 25
    for (let i = 0; i < total; i++) {
      await blogService.createBlog({
        name: `${i}` + sampleBlog.name,
        description: sampleBlog.description + `${i}`,
        websiteUrl: sampleBlog.websiteUrl
      })
    }

    const allBlogs = await blogsCollection.find({}).toArray()
    expect(allBlogs.length).toEqual(total)

    let paging: PagingParams = {
      sortDirection: SortDirection.ASC,
      sortBy: 'createdAt',
      pageSize: 4,
      pageNumber: 1
    }
    const expectedTotalPages = Math.ceil(total / paging.pageSize)

    //first page
    let rawRes = await req.get(SETTINGS.PATHS.BLOGS).query(paging)
    let res: PagedResponse<BlogViewModel> = rawRes.body
    expect(res.pageSize).toEqual(paging.pageSize)
    expect(res.totalCount).toEqual(total);
    expect(res.page).toEqual(paging.pageNumber)
    expect(res.pagesCount).toEqual(expectedTotalPages)
    expect(res.items.length).toEqual(paging.pageSize)
    expect(+res.items[0].name[0]).toEqual((paging.pageNumber - 1) * (paging.pageSize - 1));
    expect(+res.items[paging.pageSize - 1].name[0]).toEqual(paging.pageNumber * paging.pageSize - 1);

    //second page
    paging = { ...paging, pageNumber: 2 }
    rawRes = await req.get(SETTINGS.PATHS.BLOGS).query(paging)
    res = rawRes.body
    expect(res.page).toEqual(paging.pageNumber)
    expect(+res.items[0].name[0]).toEqual((paging.pageNumber - 1) * (paging.pageSize));
    expect(+res.items[paging.pageSize - 1].name[0]).toEqual(paging.pageNumber * paging.pageSize - 1);

    //searchTerm
    paging = { ...paging, pageNumber: 1, pageSize: 10 }
    let query: GetBlogsQuery = { searchNameTerm: '1', ...paging }
    rawRes = await req.get(SETTINGS.PATHS.BLOGS).query(query)
    res = rawRes.body
    expect(res.totalCount).toEqual(12);
  })



})
