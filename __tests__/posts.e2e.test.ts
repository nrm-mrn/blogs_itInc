import { ObjectId } from "mongodb";
import { SETTINGS } from "../src/settings/settings";
import { req } from "./test-helpers";
import { blogsCollection, client, postsCollection, runDb } from "../src/db/mongoDb";
import { blogService } from "../src/blogs/blogs.service";
import { blogQueryRepository } from "../src/blogs/blogsQuery.repository";
import { postsQueryRepository } from "../src/posts/postsQuery.repository";
import { BlogViewModel, GetBlogsDto } from "../src/blogs/blogs.types";
import { PagedResponse, SortDirection } from "../src/shared/types/pagination.types";
import { PostViewModel, PostInputModel } from "../src/posts/posts.types";


describe('posts routes tests', () => {
  let buff;
  let codedAuth: string;

  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await blogsCollection.drop()
    await postsCollection.drop()
    const dbSeed = {
      blogs: [
        {
          name: 'first',
          description: 'first blog desc',
          websiteUrl: 'https://google.com'
        },
        {
          name: 'second',
          description: 'second blog desc',
          websiteUrl: 'https://google.com/test'
        },
      ]
    }
    for (const blog of dbSeed.blogs) {
      await blogService.createBlog(blog);
    }

    buff = Buffer.from(SETTINGS.SUPERUSER!)
    codedAuth = buff.toString('base64')
  })

  afterAll(async () => {
    await client.close()
  })

  it('should get 200 and empty array', async () => {
    const res = await req.get(SETTINGS.PATHS.POSTS).expect(200)
    const postsPage: PagedResponse<PostViewModel> = res.body
    expect(Array.isArray(postsPage.items)).toBe(true);
    expect(postsPage.items.length).toBe(0);
  })

  it('Should get apiError wrong blogId', async () => {
    const post: PostInputModel = {
      title: 'some title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: new ObjectId(54321234),
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(400)
  })

  it('should create post', async () => {
    const dto: GetBlogsDto = {
      searchNameTerm: null, pagination: {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.DESC,
        sortBy: 'createdAt',
      }
    }
    const blogsPage: PagedResponse<BlogViewModel> = await blogQueryRepository.getAllBlogs(dto)
    const post: PostInputModel = {
      title: 'some title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[0].id
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(201)
    expect(res.body.id).toEqual(expect.any(String))
    expect(res.body.title).toEqual(post.title)
    expect(res.body.shortDescription).toEqual(post.shortDescription)
    expect(res.body.content).toEqual(post.content)
    expect(res.body.blogId).toEqual(post.blogId.toString())
  })

  it('should get a post', async () => {
    const dto: GetBlogsDto = {
      searchNameTerm: null, pagination: {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.DESC,
        sortBy: 'createdAt',
      }
    }
    const blogsPage: PagedResponse<BlogViewModel> = await blogQueryRepository.getAllBlogs(dto);
    const post: PostInputModel = {
      title: 'another title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[0].id
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(201)
    const resPost = await req.get(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
    expect(resPost.body.id).toEqual(res.body.id)
  })

  it('should update posts when the parent blog is updated', async () => {
    const dto: GetBlogsDto = {
      searchNameTerm: null, pagination: {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.DESC,
        sortBy: 'createdAt',
      }
    }
    const updatedBlog = {
      name: 'updatedName',
      description: 'first blog desc',
      websiteUrl: 'https://google.com'
    }
    const blogsPage: PagedResponse<BlogViewModel> = await blogQueryRepository.getAllBlogs(dto)

    await req.put(SETTINGS.PATHS.BLOGS + `/${blogsPage.items[0].id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(updatedBlog)
      .expect(204)

    const postsRes = await req.get(SETTINGS.PATHS.POSTS).expect(200)
    const postsPage: PagedResponse<PostViewModel> = postsRes.body

    postsPage.items.forEach(post => {
      if (post.blogId.toString() === blogsPage.items[0].id.toString()) {
        expect(post.blogName).toEqual(updatedBlog.name)
      }
    })
  })

  it('should update a post', async () => {
    const dto: GetBlogsDto = {
      searchNameTerm: null, pagination: {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.DESC,
        sortBy: 'createdAt',
      }
    }
    const blogsPage = await blogQueryRepository.getAllBlogs(dto)
    const post: PostInputModel = {
      title: 'updateable',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[1].id,
    }
    const res = await req.post(SETTINGS.PATHS.POSTS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(post)
      .expect(201)

    const invalidUpdate: PostInputModel = {
      title: 'too long title for a post should get validation error',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[1].id
    }

    await req.put(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(invalidUpdate)
      .expect(400)

    const validUpdate: PostInputModel = {
      title: 'this should work',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[1].id
    }
    await req.put(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validUpdate)
      .expect(204)

    const postsPage = await postsQueryRepository.getAllPosts(dto);

    for (const post of postsPage.items) {
      if (post.id === res.body.id) {
        expect(post.title).toEqual(validUpdate.title)
      }
    }
  })

  it('should delete a post', async () => {
    const dto: GetBlogsDto = {
      searchNameTerm: null, pagination: {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.DESC,
        sortBy: 'createdAt',
      }
    }
    const blogsPage: PagedResponse<BlogViewModel> = await blogQueryRepository.getAllBlogs(dto)
    const post: PostInputModel = {
      title: 'Deleteable',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[0].id
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

    const postsPage: PagedResponse<PostViewModel> = await postsQueryRepository.getAllPosts(dto);
    for (const post of postsPage.items) {
      if (post.id.toString() === res.body.id) {
        expect(false).toBe(true);
      }
    }
  })

  it('should delete child posts when parent blog is deleted', async () => {
    const blogsDb = await blogsCollection.find({}).toArray();
    const targetBlogId = blogsDb[0]._id
    const postsDb = await postsCollection.find({}).toArray()
    const firstBlogPosts = postsDb.filter(p => p.blogId.toString() === targetBlogId.toString())
    expect(firstBlogPosts.length).toBeGreaterThan(0);

    await req.delete(SETTINGS.PATHS.BLOGS + `/${targetBlogId}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .expect(204)

    const updatedPostsDb = await postsCollection.find({}).toArray()
    const updatedNumberPosts = updatedPostsDb.filter(p => p.blogId.toString() === targetBlogId.toString())
    expect(updatedNumberPosts.length).toBe(0)
  })

  it('should clear all blogs and posts', async () => {
    await req.delete('/testing/all-data').expect(204)
    const blogsDb = await blogsCollection.find({}).toArray()
    const postsDb = await postsCollection.find({}).toArray()

    expect(blogsDb.length).toBe(0)
    expect(postsDb.length).toBe(0)

  })
})
