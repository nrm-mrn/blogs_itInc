import { SETTINGS } from "../../src/settings/settings";
import { createUsers, loginUser, PostDto, testingDtosCreator, testSeeder } from "../test-helpers";
import { runDb } from "../../src/db/mongoDb";
import { BlogQueryRepository } from "../../src/blogs/blogsQuery.repository";
import { IBlogView, GetBlogsDto, BlogInputModel } from "../../src/blogs/blogs.types";
import { PagedResponse, SortDirection } from "../../src/shared/types/pagination.types";
import { container } from "../../src/ioc";
import { createApp } from "../../src/app";
import { agent } from "supertest";
import { BlogModel } from "../../src/blogs/blog.entity";
import mongoose from "mongoose";
import { IPostView, PostInputModel } from "../../src/posts/api/posts.api.models";
import { PostModel } from "../../src/posts/domain/post.entity";
import { PostsQueryRepository } from "../../src/posts/infrastructure/postsQuery.repository";
import { UserModel } from "../../src/users/user.entity";
import { IUserView } from "../../src/users/user.types";
import { HttpStatuses } from "../../src/shared/types/httpStatuses";
import { PostLikeStatus } from "../../src/posts/application/posts.dto";
import { PostLikeModel } from "../../src/posts/domain/postLike.entity";
import { ApiRequestService } from "../../src/security/apiRequest.service";


describe('posts e2e tests', () => {
  let buff;
  let codedAuth: string;
  let blogsQueryRepo: BlogQueryRepository;
  let postsQueryRepo: PostsQueryRepository;
  let req: any;
  let app: any;

  beforeAll(async () => {
    const res = await runDb()
    if (!res) {
      process.exit(1)
    }
    jest.spyOn(ApiRequestService.prototype, 'getDocsCountForPeriod')
      .mockResolvedValue(1)
    await BlogModel.db.dropCollection(SETTINGS.PATHS.BLOGS)
    await PostModel.db.dropCollection(SETTINGS.PATHS.POSTS)
    const blogs: Array<BlogInputModel> = [
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
    await testSeeder.createBlogs(blogs)

    buff = Buffer.from(SETTINGS.SUPERUSER!)
    codedAuth = buff.toString('base64')

    app = createApp()
    req = agent(app)
    blogsQueryRepo = container.get(BlogQueryRepository)
    postsQueryRepo = container.get(PostsQueryRepository)
  })

  afterAll(async () => {
    await mongoose.connection.close();
  })

  it('should get 200 and empty array', async () => {
    const res = await req.get(SETTINGS.PATHS.POSTS).expect(200)
    const postsPage: PagedResponse<IPostView> = res.body
    expect(Array.isArray(postsPage.items)).toBe(true);
    expect(postsPage.items.length).toBe(0);
  })

  it('Should get apiError wrong blogId', async () => {
    const post: PostInputModel = {
      title: 'some title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: '54321234',
    }
    await req.post(SETTINGS.PATHS.POSTS)
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
    const blogsPage: PagedResponse<IBlogView> = await blogsQueryRepo.getAllBlogs(dto)
    const post: PostInputModel = {
      title: 'some title',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[0].id,
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
    const blogsPage: PagedResponse<IBlogView> = await blogsQueryRepo.getAllBlogs(dto);
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
    const blogsPage = await blogsQueryRepo.getAllBlogs(dto)

    await req.put(SETTINGS.PATHS.BLOGS + `/${blogsPage.items[0].id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(updatedBlog)
      .expect(204)

    const postsRes = await req.get(SETTINGS.PATHS.POSTS).expect(200)
    const postsPage: PagedResponse<IPostView> = postsRes.body

    postsPage.items.forEach(post => {
      if (post.blogId === blogsPage.items[0].id) {
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
    const blogsPage = await blogsQueryRepo.getAllBlogs(dto)
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
      blogId: blogsPage.items[1].id,
    }

    await req.put(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(invalidUpdate)
      .expect(400)

    const validUpdate: PostInputModel = {
      title: 'this should work',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[1].id,
    }
    await req.put(SETTINGS.PATHS.POSTS + `/${res.body.id}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send(validUpdate)
      .expect(204)

    const postsPage = await postsQueryRepo.getAllPosts(dto);

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
    const blogsPage: PagedResponse<IBlogView> = await blogsQueryRepo.getAllBlogs(dto)
    const post: PostInputModel = {
      title: 'Deleteable',
      shortDescription: 'short desc',
      content: 'some post content',
      blogId: blogsPage.items[0].id,
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

    const postsPage: PagedResponse<IPostView> = await postsQueryRepo.getAllPosts(dto);
    for (const post of postsPage.items) {
      if (post.id.toString() === res.body.id) {
        expect(false).toBe(true);
      }
    }
  })

  it('should delete child posts when parent blog is deleted', async () => {
    const blogsDb = await BlogModel.find({}).lean()
    const targetBlogId = blogsDb[0]._id
    const postsDb = await PostModel.find({}).lean()
    const firstBlogPosts = postsDb.filter(p => p.blogId.toString() === targetBlogId.toString())
    expect(firstBlogPosts.length).toBeGreaterThan(0);

    await req.delete(SETTINGS.PATHS.BLOGS + `/${targetBlogId}`)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .expect(204)

    const updatedPostsDb = await PostModel.find({}).lean()
    const updatedNumberPosts = updatedPostsDb.filter(p => p.blogId.toString() === targetBlogId.toString())
    expect(updatedNumberPosts.length).toBe(0)
  })

  it('should clear all blogs and posts', async () => {
    await req.delete('/testing/all-data').expect(204)
    const blogsDb = await BlogModel.find({}).lean()
    const postsDb = await PostModel.find({}).lean()

    expect(blogsDb.length).toBe(0)
    expect(postsDb.length).toBe(0)

  })

  describe('post likes e2e tests', () => {
    let posts: IPostView[];
    let users: IUserView[];
    let blogs: IBlogView[];

    beforeAll(async () => {
      await UserModel.db.dropCollection(SETTINGS.PATHS.USERS)
      await BlogModel.db.dropCollection(SETTINGS.PATHS.BLOGS)
      await PostModel.db.dropCollection(SETTINGS.PATHS.POSTS)
      await PostLikeModel.db.dropCollection(SETTINGS.PATHS.POSTS_LIKES)

      users = await createUsers(req, 4)
      const blogsInput = testingDtosCreator.createBlogsDto(2)
      blogs = await testSeeder.createBlogs(blogsInput);
      const postsInput: Array<PostDto> = [];
      blogs.forEach(blog => {
        const postsDtos = testingDtosCreator.createPostsDto(blog.id.toString(), 3);
        postsInput.push(...postsDtos)
      })
      posts = await testSeeder.createPosts(postsInput);
    }, 20000)

    it('should like a post', async () => {
      const postId = posts[0].id
      const validLikeBody = { likeStatus: "Like" }

      //unauthenticated error
      await req.put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .send()
        .expect(401)

      //create a like
      let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)

      //check likes count increased
      let res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .expect(HttpStatuses.Success)
      let post: IPostView = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(1)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(0)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.NONE)
      expect(post.extendedLikesInfo.newestLikes.length).toBe(1)


      //check like status with authenticated req
      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      post = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(1)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(0)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.LIKE)

      //second user like status is unchanged
      let { accessToken: token2 } = await loginUser(req, { loginOrEmail: users[1].login, password: '12345678' });
      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token2 })
      post = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(1)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(0)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.NONE)

      //like from second user
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)

      //check likes count increased
      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .expect(HttpStatuses.Success)
      post = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(2)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(0)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.LIKE)
      expect(post.extendedLikesInfo.newestLikes.length).toBe(2)

      //third and 4th likes
      let { accessToken: token3 } = await loginUser(req, { loginOrEmail: users[2].login, password: '12345678' });
      let { accessToken: token4 } = await loginUser(req, { loginOrEmail: users[3].login, password: '12345678' });
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token3 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token4 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)

      //check recentlikes
      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .expect(HttpStatuses.Success)
      post = res.body
      expect(post.extendedLikesInfo.newestLikes.length).toBe(3)

      //remove like from first user
      const validNoneBody = { likeStatus: 'None' }
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .send(validNoneBody)
        .expect(HttpStatuses.NoContent)

      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .expect(HttpStatuses.Success)
      post = res.body
      expect(post.extendedLikesInfo.dislikesCount).toEqual(0)
      expect(post.extendedLikesInfo.likesCount).toEqual(3)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.NONE)
      expect(post.extendedLikesInfo.newestLikes.length).toBe(3)

      //dislike from second
      const validDislikeBody = { likeStatus: 'Dislike' }
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .send(validDislikeBody)
        .expect(HttpStatuses.NoContent)

      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .expect(HttpStatuses.Success)
      post = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(2)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(1)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.DISLIKE)
      expect(post.extendedLikesInfo.newestLikes.length).toBe(2)
    }, 10000)

    it('Should change statuses with different users interactions', async () => {
      const postId = posts[1].id
      const validLikeBody = { likeStatus: "Like" }

      let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
      let { accessToken: token2 } = await loginUser(req, { loginOrEmail: users[1].login, password: '12345678' });
      let { accessToken: token3 } = await loginUser(req, { loginOrEmail: users[2].login, password: '12345678' });
      //create a dislike by user1
      const validDislikeBody = { likeStatus: "Dislike" }
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .send(validDislikeBody)
        .expect(HttpStatuses.NoContent)

      //check like status with authenticated req
      let res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      let post = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(0)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(1)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.DISLIKE)

      //create a dislike by user2
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .send(validDislikeBody)
        .expect(HttpStatuses.NoContent)

      //check like status with authenticated req
      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      post = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(0)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(2)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.DISLIKE)

      //create a like by user3
      await req
        .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token3 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)

      //check like status with authenticated req
      res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      post = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(1)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(2)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.DISLIKE)
    })

    it('should not change like status with multiple requests', async () => {
      const postId = posts[2].id
      const validLikeBody = { likeStatus: "Like" }

      //create a like
      let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
      for (let i = 0; i < 3; i++) {
        await req
          .put(SETTINGS.PATHS.POSTS + `/${postId}/like-status`)
          .set({ 'authorization': 'Bearer ' + token1 })
          .send(validLikeBody)
          .expect(HttpStatuses.NoContent)
      }

      //check likes count
      let res = await req
        .get(SETTINGS.PATHS.POSTS + `/${postId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .expect(HttpStatuses.Success)
      let post: IPostView = res.body
      expect(post.extendedLikesInfo.likesCount).toEqual(1)
      expect(post.extendedLikesInfo.dislikesCount).toEqual(0)
      expect(post.extendedLikesInfo.myStatus).toEqual(PostLikeStatus.LIKE)
    })

    it('should delete likes when a post is deleted', async () => {
      const postId1 = posts[0].id
      const postId2 = posts[1].id
      const postId3 = posts[2].id

      await req.delete(SETTINGS.PATHS.POSTS + `/${postId1}`)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(204)
      await req.delete(SETTINGS.PATHS.POSTS + `/${postId2}`)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(204)
      await req.delete(SETTINGS.PATHS.POSTS + `/${postId3}`)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(204)

      const likes = await PostLikeModel.find().lean();
      expect(likes.length).toBe(0);
    })
  })
})
