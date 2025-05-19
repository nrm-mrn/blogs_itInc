import { SETTINGS } from "../../src/settings/settings";
import { CommentDto, createUsers, loginUser, PostDto, testingDtosCreator, testSeeder } from "../test-helpers";
import { runDb } from "../../src/db/mongoDb";
import { IBlogView } from "../../src/blogs/blogs.types";
import { PagedResponse } from "../../src/shared/types/pagination.types";
import { IPostView } from "../../src/posts/posts.types";
import { CommentInputModel, ICommentView } from "../../src/comments/comments.types";
import { IUserView } from "../../src/users/user.types";
import { createApp } from "../../src/app";
import { agent } from "supertest";
import TestAgent from "supertest/lib/agent";
import { UserModel } from "../../src/users/user.entity";
import { BlogModel } from "../../src/blogs/blog.entity";
import { PostModel } from "../../src/posts/post.entity";
import { CommentModel } from "../../src/comments/comment.entity";
import mongoose from "mongoose";
import { CommentLikeDocument, CommentLikeModel, LikeStatus } from "../../src/comments/commentLike.entity";
import { HttpStatuses } from "../../src/shared/types/httpStatuses";
import { ApiRequestService } from "../../src/security/apiRequest.service";


describe('comments e2e test', () => {
  let users: Array<IUserView>;
  let blogs: Array<IBlogView>;
  let posts: Array<IPostView>;
  let app: any;
  let req: TestAgent;


  beforeAll(async () => {
    const res = await runDb()
    if (!res) {
      process.exit(1)
    }
    await UserModel.db.dropCollection(SETTINGS.PATHS.USERS)
    await BlogModel.db.dropCollection(SETTINGS.PATHS.BLOGS)
    await PostModel.db.dropCollection(SETTINGS.PATHS.USERS)
    await CommentModel.db.dropCollection(SETTINGS.PATHS.COMMENTS)

    jest.spyOn(ApiRequestService.prototype, 'getDocsCountForPeriod')
      .mockResolvedValue(1)

    app = createApp();
    req = agent(app);

    users = await createUsers(req, 3)
    const blogsInput = testingDtosCreator.createBlogsDto(3)
    blogs = await testSeeder.createBlogs(blogsInput);
    const postsInput: Array<PostDto> = [];
    blogs.forEach(blog => {
      const postsDtos = testingDtosCreator.createPostsDto(blog.id.toString(), 5);
      postsInput.push(...postsDtos)
    })
    posts = await testSeeder.createPosts(postsInput);
  }, 15000)

  afterAll(async () => {
    await mongoose.connection.close()
  })

  it('should get 200 and 404 on get comments for post', async () => {
    const postId = posts[0].id
    const res = await req.get(SETTINGS.PATHS.POSTS + `/${postId}/comments`).expect(200)
    const commentsPage: PagedResponse<ICommentView> = res.body
    expect(Array.isArray(commentsPage.items)).toBe(true);
    expect(commentsPage.items.length).toBe(0);
    expect(commentsPage.items[0].likesInfo.dislikesCount).toEqual(0)
    expect(commentsPage.items[0].likesInfo.likesCount).toEqual(0)
    expect(commentsPage.items[0].likesInfo.myStatus).toEqual(LikeStatus.NONE)
    const invailPost = new mongoose.Types.ObjectId()
    await req.get(SETTINGS.PATHS.POSTS + `/${invailPost}/comments`).expect(404)
  })

  it('Should create a comment', async () => {
    const validComment: CommentInputModel = {
      content: 'test comment content',
    }
    const invalidComment: CommentInputModel = {
      content: 'test',
    }
    const postId = posts[0].id
    await req.post(SETTINGS.PATHS.POSTS + `/${postId}/comments`)
      .set({ 'authorization': 'Bearer ' + 'sdfas' })
      .send(validComment)
      .expect(401)
    const { accessToken } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
    let res = await req.post(SETTINGS.PATHS.POSTS + `/${postId}/comments`)
      .set({ 'authorization': 'Bearer ' + accessToken })
      .send(invalidComment)
      .expect(400)
    expect(res.body).toEqual(expect.objectContaining(
      {
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({ field: 'content' })
        ])
      }
    ))

    res = await req.post(SETTINGS.PATHS.POSTS + `/${postId}/comments`)
      .set({ 'authorization': 'Bearer ' + accessToken })
      .send(validComment)
      .expect(201)
    expect(res.body).toEqual(expect.objectContaining(
      {
        id: expect.any(String),
        content: validComment.content,
        commentatorInfo: expect.objectContaining({
          userLogin: users[0].login,
          userId: expect.any(String)
        }),
        createdAt: expect.any(String)
      }
    ))
    res = await req.get(SETTINGS.PATHS.POSTS + `/${postId}/comments`).expect(200)
    const commentsPage: PagedResponse<ICommentView> = res.body
    expect(commentsPage.items.length).toBe(1);
  })

  it('should edit a comment', async () => {
    const validComment = { content: 'new valid comment for post' }
    const updatedComment = { content: 'updated comment content' }
    const postId = posts[1].id
    let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
    let res = await req.post(SETTINGS.PATHS.POSTS + `/${postId}/comments`)
      .set({ 'authorization': 'Bearer ' + token1 })
      .send(validComment)
      .expect(201)
    const commentId = res.body.id

    //should not edit unauthenticated
    res = await req.put(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
      .set({ 'authorization': 'Bearer ' + 'safsdf' })
      .send(updatedComment)
      .expect(401)

    //should not edit not own comment
    let { accessToken: token2 } = await loginUser(req, { loginOrEmail: users[1].login, password: '12345678' });
    res = await req.put(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
      .set({ 'authorization': 'Bearer ' + token2 })
      .send(updatedComment)
      .expect(403)

    //should not find non existent comment
    const invalidCommentId = new mongoose.Types.ObjectId().toString()
    res = await req.put(SETTINGS.PATHS.COMMENTS + `/${invalidCommentId}`)
      .set({ 'authorization': 'Bearer ' + token1 })
      .send(updatedComment)
      .expect(404)

    //should edit ok
    res = await req.put(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
      .set({ 'authorization': 'Bearer ' + token1 })
      .send(updatedComment)
      .expect(204)

    res = await req.get(SETTINGS.PATHS.POSTS + `/${postId}/comments`).expect(200)
    const commentsPage: PagedResponse<ICommentView> = res.body
    expect(commentsPage.items[0].content).toEqual(updatedComment.content);

  })

  it('should delete a comment', async () => {
    const validComment = { content: 'new valid comment for post for deletion' }
    const postId = posts[2].id
    let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
    let res = await req.post(SETTINGS.PATHS.POSTS + `/${postId}/comments`)
      .set({ 'authorization': 'Bearer ' + token1 })
      .send(validComment)
      .expect(201)
    const commentId = res.body.id

    //should not delete unauthenticated
    res = await req.delete(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
      .set({ 'authorization': 'Bearer ' + 'safsdf' })
      .expect(401)

    //should not delete not own comment
    let { accessToken: token2 } = await loginUser(req, { loginOrEmail: users[1].login, password: '12345678' });
    res = await req.delete(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
      .set({ 'authorization': 'Bearer ' + token2 })
      .expect(403)

    //should not find non existent comment
    const invalidCommentId = new mongoose.Types.ObjectId().toString()
    res = await req.delete(SETTINGS.PATHS.COMMENTS + `/${invalidCommentId}`)
      .set({ 'authorization': 'Bearer ' + token1 })
      .expect(404)

    //should delete ok
    res = await req.delete(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
      .set({ 'authorization': 'Bearer ' + token1 })
      .expect(204)

    res = await req.get(SETTINGS.PATHS.POSTS + `/${postId}/comments`).expect(200)
    const commentsPage: PagedResponse<ICommentView> = res.body
    expect(commentsPage.items.length).toBe(0)
  })

  describe('comment likes e2e tests', () => {
    let comments: ICommentView[];

    beforeAll(async () => {
      await CommentLikeModel.db.dropCollection(SETTINGS.PATHS.COMMENTS_LIKES);
      await UserModel.db.dropCollection(SETTINGS.PATHS.USERS)
      await BlogModel.db.dropCollection(SETTINGS.PATHS.BLOGS)
      await PostModel.db.dropCollection(SETTINGS.PATHS.POSTS)
      await CommentModel.db.dropCollection(SETTINGS.PATHS.COMMENTS)

      users = await createUsers(req, 2)
      const blogsInput = testingDtosCreator.createBlogsDto(2)
      blogs = await testSeeder.createBlogs(blogsInput);
      const postsInput: Array<PostDto> = [];
      blogs.forEach(blog => {
        const postsDtos = testingDtosCreator.createPostsDto(blog.id.toString(), 2);
        postsInput.push(...postsDtos)
      })
      posts = await testSeeder.createPosts(postsInput);
      const commentsInput: Array<CommentDto> = [];
      posts.forEach(post => {
        const commentDtos = testingDtosCreator.createCommentsDto(post.id, users[0].id, 2)
        commentsInput.push(...commentDtos);
      })
      comments = await testSeeder.createComments(commentsInput);
    }, 30000)

    it('should like a comment', async () => {
      const commentId = comments[0].id
      const validLikeBody = { likeStatus: "Like" }

      //unauthenticated error
      await req.put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .send()
        .expect(401)

      //create a like
      let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
      await req
        .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)

      //check likes count increased
      let res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .expect(HttpStatuses.Success)
      let like: ICommentView = res.body
      expect(like.likesInfo.likesCount).toEqual(1)
      expect(like.likesInfo.dislikesCount).toEqual(0)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.NONE)


      //check like status with authenticated req
      res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      like = res.body
      expect(like.likesInfo.likesCount).toEqual(1)
      expect(like.likesInfo.dislikesCount).toEqual(0)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.LIKE)

      //second user like status is unchanged
      let { accessToken: token2 } = await loginUser(req, { loginOrEmail: users[1].login, password: '12345678' });
      res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token2 })
      like = res.body
      expect(like.likesInfo.likesCount).toEqual(1)
      expect(like.likesInfo.dislikesCount).toEqual(0)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.NONE)

      //like from second user
      await req
        .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)

      //check likes count increased
      res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .expect(HttpStatuses.Success)
      like = res.body
      expect(like.likesInfo.likesCount).toEqual(2)
      expect(like.likesInfo.dislikesCount).toEqual(0)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.LIKE)

      //remove like from first user
      const validNoneBody = { likeStatus: 'None' }
      await req
        .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .send(validNoneBody)
        .expect(HttpStatuses.NoContent)

      res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .expect(HttpStatuses.Success)
      like = res.body
      expect(like.likesInfo.dislikesCount).toEqual(0)
      expect(like.likesInfo.likesCount).toEqual(1)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.NONE)

      //dislike from second
      const validDislikeBody = { likeStatus: 'Dislike' }
      await req
        .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .send(validDislikeBody)
        .expect(HttpStatuses.NoContent)

      res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .expect(HttpStatuses.Success)
      like = res.body
      expect(like.likesInfo.likesCount).toEqual(0)
      expect(like.likesInfo.dislikesCount).toEqual(1)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.DISLIKE)
    })

    it('Should change statuses with different users interactions', async () => {
      const commentId = comments[1].id
      const validLikeBody = { likeStatus: "Like" }

      let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
      let { accessToken: token2 } = await loginUser(req, { loginOrEmail: users[1].login, password: '12345678' });
      let { accessToken: token3 } = await loginUser(req, { loginOrEmail: users[2].login, password: '12345678' });
      //create a dislike by user1
      const validDislikeBody = { likeStatus: "Dislike" }
      await req
        .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .send(validDislikeBody)
        .expect(HttpStatuses.NoContent)

      //check like status with authenticated req
      let res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      let like = res.body
      expect(like.likesInfo.likesCount).toEqual(0)
      expect(like.likesInfo.dislikesCount).toEqual(1)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.DISLIKE)

      //create a dislike by user2
      await req
        .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token2 })
        .send(validDislikeBody)
        .expect(HttpStatuses.NoContent)

      //check like status with authenticated req
      res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      like = res.body
      expect(like.likesInfo.likesCount).toEqual(0)
      expect(like.likesInfo.dislikesCount).toEqual(2)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.DISLIKE)

      //create a like by user3
      await req
        .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
        .set({ 'authorization': 'Bearer ' + token3 })
        .send(validLikeBody)
        .expect(HttpStatuses.NoContent)

      //check like status with authenticated req
      res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
      like = res.body
      expect(like.likesInfo.likesCount).toEqual(1)
      expect(like.likesInfo.dislikesCount).toEqual(2)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.DISLIKE)
    })

    it('should not change like status with multiple requests', async () => {
      const commentId = comments[0].id
      const validLikeBody = { likeStatus: "Like" }

      //create a like
      let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });
      for (let i = 0; i < 3; i++) {
        await req
          .put(SETTINGS.PATHS.COMMENTS + `/${commentId}/like-status`)
          .set({ 'authorization': 'Bearer ' + token1 })
          .send(validLikeBody)
          .expect(HttpStatuses.NoContent)
      }

      //check likes count
      let res = await req
        .get(SETTINGS.PATHS.COMMENTS + `/${commentId}`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .expect(HttpStatuses.Success)
      let like: ICommentView = res.body
      expect(like.likesInfo.likesCount).toEqual(1)
      expect(like.likesInfo.dislikesCount).toEqual(1)
      expect(like.likesInfo.myStatus).toEqual(LikeStatus.LIKE)
    })

    it('should delete likes when a comment is deleted', async () => {
      const commentId1 = comments[0].id
      const commentId2 = comments[1].id
      let { accessToken: token1 } = await loginUser(req, { loginOrEmail: users[0].login, password: '12345678' });

      await req.delete(SETTINGS.PATHS.COMMENTS + `/${commentId1}`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .expect(204)
      await req.delete(SETTINGS.PATHS.COMMENTS + `/${commentId2}`)
        .set({ 'authorization': 'Bearer ' + token1 })
        .expect(204)

      const likes = await CommentLikeModel.find().lean();
      expect(likes.length).toBe(0);
    })
  })
})
