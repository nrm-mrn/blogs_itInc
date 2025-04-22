import { agent } from "supertest";
import { app } from '../src/app'
import { SETTINGS } from "../src/settings/settings";
import { LoginDto } from "../src/auth/auth.types";
import { BlogInputModel, BlogViewModel } from "../src/blogs/blogs.types";
import { blogService } from "../src/blogs/blogs.service";
import { PostInputModel, PostViewModel } from "../src/posts/posts.types";
import { postsService } from "../src/posts/posts.service";
import { ObjectId } from "mongodb";
import { IUserView } from "../src/users/user.types";
import { User } from "../src/users/user.entity";
import { usersRepository } from "../src/users/users.repository";

export const req = agent(app)

export type UserDto = {
  login: string
  email: string
  pass: string
}


export const testingDtosCreator = {
  createUserDto({ login, email, pass }: {
    login?: string, email?: string, pass?: string
  }): UserDto {
    return {
      login: login ?? 'test',
      email: email ?? 'test@gmail.com',
      pass: pass ?? '123456789',

    }
  },
  createUserDtos(count: number): UserDto[] {
    const users: Array<UserDto> = [];
    for (let i = 0; i <= count; i++) {
      users.push({
        login: 'test' + i,
        email: `test${i}@gmail.com`,
        pass: '12345678'
      })
    }
    return users;
  },

  createBlogDto() {
    return {
      name: 'test',
      description: 'test blog desc',
      websiteUrl: 'https://google.com'
    }
  },

  createBlogsDto(count: number) {
    const blogs: Array<BlogInputModel> = [];
    for (let i = 0; i < count; i++) {
      blogs.push(
        {
          name: `${i}test`,
          description: `${i} test blog desc`,
          websiteUrl: `https://${i}google.com`
        }
      )
    }
    return blogs
  },

  createPostsDto(blogId: string, count: number) {
    const posts: Array<PostDto> = [];
    for (let i = 0; i < count; i++) {
      posts.push(
        {
          title: 'some title',
          shortDescription: 'short desc',
          content: 'some post content',
          blogId,
        }
      )
    }
    return posts
  },
}

const buff = Buffer.from(SETTINGS.SUPERUSER!);
const codedAuth = buff.toString('base64')

export const createUser = async (userDto?: UserDto) => {
  const dto = userDto ?? testingDtosCreator.createUserDto({});

  const resp = await req
    .post(SETTINGS.PATHS.USERS)
    .set({ 'authorization': 'Basic ' + codedAuth })
    .send({
      login: dto.login,
      email: dto.email,
      password: dto.pass,
    })
    .expect(201);
  return resp.body;
};

export const createUsers = async (count: number) => {
  const users: Array<IUserView> = [];

  for (let i = 0; i <= count; i++) {
    const resp = await req
      .post(SETTINGS.PATHS.USERS)
      .set({ 'authorization': 'Basic ' + codedAuth })
      .send({
        login: 'test' + i,
        email: `test${i}@gmail.com`,
        password: '12345678',
      })
      .expect(201);

    users.push(resp.body);
  }
  return users;
};

export const insertUser = async (user: User) => {
  await usersRepository.createUser(user);
  return
}

export const loginUser = async (loginDto?: LoginDto): Promise<{ accessToken: string }> => {
  const defaultUser = testingDtosCreator.createUserDto({})
  const dto = loginDto ?? { loginOrEmail: defaultUser.login, password: defaultUser.pass }
  const resp = await req
    .post(SETTINGS.PATHS.AUTH + '/login')
    .send(dto)
    .expect(200)
  return resp.body
}

export type PostDto = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}
export const testSeeder = {

  async createPosts(input: Array<PostDto>) {
    const posts: Array<PostViewModel> = [];
    for (let i = 0; i < input.length; i++) {
      const postInput: PostInputModel = { ...input[0], blogId: new ObjectId(input[0].blogId) }
      const { post } = await postsService.createPost(postInput)
      posts.push(post!)
    }
    return posts
  },

  async createBlogs(input: Array<BlogInputModel>) {
    const blogs: Array<BlogViewModel> = [];
    for (let i = 0; i < input.length; i++) {
      const { newBlog } = await blogService.createBlog(input[i])
      blogs.push(newBlog!)
    }
    return blogs
  }
}

