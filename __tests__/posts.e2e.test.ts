import { db, setDb } from "../src/db/db";
import { PostInputModel, PostViewModel } from "../src/db/db-types";
import { SETTINGS } from "../src/settings/settings";
import { req } from "./test-helpers";


describe('posts routes tests', () => {
  let buff;
  let codedAuth: string;

  beforeAll(async () => {
    const dbSeed = {
      blogs: [
        {
          id: '1234',
          name: 'first',
          description: 'first blog desc',
          websiteUrl: 'https://google.com'
        },
        {
          id: '4321',
          name: 'second',
          description: 'second blog desc',
          websiteUrl: 'https://google.com/test'
        },
      ]
    }
    setDb(dbSeed);
    buff = Buffer.from(db.users[0].auth)
    codedAuth = buff.toString('base64')
  })

  it('should get 200 and empty array', async () => {
    const res = await req.get(SETTINGS.PATHS.POSTS).expect(200)
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  })

  it('Should get apiError wrong blogId', async () => {
    const post: PostInputModel = {
      title: 'some title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: '54232',
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(400)
    console.log(res.body)
    expect(res.body.errorsMessages[0].field).toEqual('blogId')
  })

  it('should create post', async () => {
    const post: PostInputModel = {
      title: 'some title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: db.blogs[0].id,
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(201)
    expect(res.body.id).toEqual(expect.any(String))
    expect(res.body.title).toEqual(post.title)
    expect(res.body.shortDescription).toEqual(post.shortDescription)
    expect(res.body.content).toEqual(post.content)
    expect(res.body.blogId).toEqual(post.blogId)
  })

  it('should get a post', async () => {
    const post: PostInputModel = {
      title: 'another title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: db.blogs[0].id,
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(201)
    const resPost = await req.get(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
    expect(resPost.body.id).toEqual(res.body.id)
  })

  it('should update posts when the parent blog is updated', async () => {
    const updatedBlog = {
      id: '1234',
      name: 'updatedName',
      description: 'first blog desc',
      websiteUrl: 'https://google.com'
    }

    await req.put(SETTINGS.PATHS.BLOGS + `/${updatedBlog.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(updatedBlog)
      .expect(204)

    const postsRes = await req.get(SETTINGS.PATHS.POSTS).expect(200)
    const posts: PostViewModel[] = postsRes.body

    posts.forEach(post => {
      expect(post.blogName).toEqual(updatedBlog.name)
    })
  })

  it('should update a post', async () => {
    const post: PostInputModel = {
      title: 'updateable',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: db.blogs[1].id,
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(201)

    const invalidUpdate: PostInputModel = {
      title: 'too long title for a post should get validation error',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: db.blogs[1].id,
    }

    await req.put(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(invalidUpdate)
      .expect(400)

    const validUpdate: PostInputModel = {
      title: 'this should work',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: db.blogs[1].id,
    }
    await req.put(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validUpdate)
      .expect(204)

    expect(db.posts.find(p => p.id === res.body.id)?.title).toEqual(validUpdate.title)
  })

  it('should delete a post', async () => {
    const post: PostInputModel = {
      title: 'Deleteable',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: db.blogs[1].id,
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(201)

    await req.delete(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .expect(401)

    await req.delete(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .expect(204)

    expect(db.posts.find(p => p.id === res.body.is)).toBeUndefined()
  })

  it('should delete child posts when parent blog is deleted', async () => {
    const targetBlogId = db.blogs[0].id
    const firstBlogPosts = db.posts.filter(p => p.blogId === targetBlogId)
    expect(firstBlogPosts.length).toBeGreaterThan(0);

    await req.delete(SETTINGS.PATHS.BLOGS + `/${targetBlogId}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .expect(204)

    const updatedNumberPosts = db.posts.filter(p => p.blogId === targetBlogId)
    expect(updatedNumberPosts.length).toBe(0)
  })

  it('should clear all blogs and posts', async () => {
    await req.delete('/testing/all-data').expect(204)

    expect(db.blogs.length).toBe(0)
    expect(db.posts.length).toBe(0)

  })

})
