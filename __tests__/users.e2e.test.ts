import { blogsCollection, client, postsCollection, runDb, usersCollection } from "../src/db/mongoDb";
import { userService } from "../src/users/users.service";
import { SETTINGS } from "../src/settings/settings";
import { PagedResponse, PagingQuery, SortDirection } from "../src/shared/types/pagination.types";
import { GetUsersQuery, UserInputModel, UserViewModel } from "../src/users/users.types";
import { req } from "./test-helpers";
import { BlogViewModel } from "../src/blogs/blogs.types";

describe('users tests', () => {

  let buff;
  let codedAuth: string;
  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await blogsCollection.drop()
    await postsCollection.drop()
    await usersCollection.drop()
    buff = Buffer.from(SETTINGS.SUPERUSER!);
    codedAuth = buff.toString('base64')
  })

  afterAll(async () => {
    await client.close()
  })


  describe('users routes tests', () => {
    it('Should get 200 and an empty array', async () => {

      const res = await req.get(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(200)
      const usersPage: PagedResponse<BlogViewModel> = res.body
      expect(Array.isArray(usersPage.items)).toBe(true);
      expect(usersPage.items.length).toBe(0);

    })

    it('Should create a user', async () => {
      const validUser: UserInputModel = {
        login: 'testUser',
        password: 'qwerty123',
        email: 'test@gmail.com'
      }
      let res = await req.post(SETTINGS.PATHS.USERS)
        .send(validUser).expect(401)

      res = await req.post(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .send(validUser)
        .expect(201)
      expect(res.body.id).toEqual(expect.any(String))
      expect(res.body.login).toEqual(validUser.login)
      expect(res.body.email).toEqual(validUser.email)
      expect(res.body.createdAt).toEqual(expect.any(String))
    })

    it('Should get 200 and one user', async () => {
      const res = await req.get(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(200)
      const usersPage: PagedResponse<UserViewModel> = res.body
      expect(usersPage.items.length).toBe(1);
      expect(usersPage.totalCount).toBe(1);

    })

    it('Should delete a user', async () => {
      const res = await req.get(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(200)
      const usersPage: PagedResponse<UserViewModel> = res.body
      expect(usersPage.items.length).toBeGreaterThan(0);
      const originalTotal = usersPage.totalCount;
      const user = usersPage.items[0]


      await req.delete(SETTINGS.PATHS.USERS + `/${user.id}`)
        .expect(401)


      await req.delete(SETTINGS.PATHS.USERS + `/${user.id}`)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(204)

      const res2 = await req.get(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(200)
      const newUsersPage: PagedResponse<UserViewModel> = res2.body
      expect(newUsersPage.totalCount).toBe(originalTotal - 1)

      await req.delete(SETTINGS.PATHS.USERS + `/${user.id}`)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(404)
    })

    it('Should get validation errors', async () => {
      const user1: UserInputModel = {
        login: 'first',
        password: 'wer1234',
        email: 'test@yandex.ru'
      }
      const userInvLogin: UserInputModel = {
        login: user1.login,
        password: 'dfsaf213',
        email: 'sdf@mail.com'
      }
      const userInvEmail: UserInputModel = {
        login: 'second',
        password: 'dfsaf213',
        email: user1.email,
      }
      await req.post(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .send(user1)
        .expect(201)

      //duplicate login
      let res = await req.post(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .send(userInvLogin)
        .expect(400)
      expect(res.body).toHaveProperty('errorsMessages');
      expect(res.body.errorsMessages).toEqual(
        expect.arrayContaining([{ message: expect.any(String), field: 'login' }])
      )

      //duplicate email
      res = await req.post(SETTINGS.PATHS.USERS)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .send(userInvEmail)
        .expect(400)
      expect(res.body).toHaveProperty('errorsMessages');
      expect(res.body.errorsMessages).toEqual(
        expect.arrayContaining([{ message: expect.any(String), field: 'email' }])
      )
    })

    it('Test search params', async () => {
      await usersCollection.drop();
      const userPattern: UserInputModel =
      {
        login: 'testPatt',
        password: 'asdfg123',
        email: 'testing@mail.com'
      }
      const total = 25
      for (let i = 0; i < total; i++) {
        await userService.createUser({
          login: `${i}` + userPattern.login,
          password: userPattern.password,
          email: `${i + 30}` + userPattern.email,
        })
      }

      let paging: PagingQuery = {
        sortDirection: SortDirection.ASC,
        sortBy: 'createdAt',
        pageSize: 50,
        pageNumber: 1
      }

      let res = await req.get(SETTINGS.PATHS.USERS).query(paging)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(200)
      const usersPage: PagedResponse<BlogViewModel> = res.body
      expect(usersPage.totalCount).toBe(25);

      let query: GetUsersQuery = {
        searchLoginTerm: '1',
        ...paging
      }

      let rawRes = await req.get(SETTINGS.PATHS.USERS).query(query)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(200)
      let res2: PagedResponse<UserViewModel> = rawRes.body
      expect(res2.items.length).toBe(12)

      query = {
        searchLoginTerm: '1',
        searchEmailTerm: '54',
        ...paging
      }

      rawRes = await req.get(SETTINGS.PATHS.USERS).query(query)
        .set({ 'authorization': 'Basic ' + codedAuth })
        .expect(200)
      const res3: PagedResponse<UserViewModel> = rawRes.body
      expect(res3.items.length).toBe(13)
    }, 20000)
  })
})
