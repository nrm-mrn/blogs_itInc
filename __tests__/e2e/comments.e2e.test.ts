import { ObjectId } from "mongodb";
import { SETTINGS } from "../../src/settings/settings";
import { createUsers, loginUser, PostDto, testingDtosCreator, testSeeder } from "../test-helpers";
import { blogsCollection, client, commentsCollection, postsCollection, runDb, usersCollection } from "../../src/db/mongoDb";
import { IBlogView } from "../../src/blogs/blogs.types";
import { PagedResponse } from "../../src/shared/types/pagination.types";
import { IPostView } from "../../src/posts/posts.types";
import { CommentInputModel, ICommentView } from "../../src/comments/comments.types";
import { IUserView } from "../../src/users/user.types";
import { createApp } from "../../src/app";
import { agent } from "supertest";
import TestAgent from "supertest/lib/agent";


describe('comments e2e test', () => {
  let users: Array<IUserView>;
  let blogs: Array<IBlogView>;
  let posts: Array<IPostView>;
  let app: any;
  let req: TestAgent;


  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await usersCollection.drop()
    await blogsCollection.drop()
    await postsCollection.drop()
    await commentsCollection.drop()

    app = createApp();
    req = agent(app);

    users = await createUsers(req, 2)
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
    await client.close()
  })

  it('should get 200 and 404 on get comments for post', async () => {
    const postId = posts[0].id
    const res = await req.get(SETTINGS.PATHS.POSTS + `/${postId}/comments`).expect(200)
    const commentsPage: PagedResponse<ICommentView> = res.body
    expect(Array.isArray(commentsPage.items)).toBe(true);
    expect(commentsPage.items.length).toBe(0);
    const invailPost = new ObjectId()
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
    const invalidCommentId = new ObjectId().toString()
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
    const invalidCommentId = new ObjectId().toString()
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
})
