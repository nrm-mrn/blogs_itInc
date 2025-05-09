import { SETTINGS } from "../src/settings/settings";
import { BlogInputModel, IBlogView } from "../src/blogs/blogs.types";
import { BlogService } from "../src/blogs/blogs.service";
import { PostInputModel, IPostView } from "../src/posts/posts.types";
import { PostsService } from "../src/posts/posts.service";
import { ObjectId } from "mongodb";
import { IUserView, UserInputModel } from "../src/users/user.types";
import { User } from "../src/users/user.entity";
import { UsersRepository } from "../src/users/users.repository";
import { BlogQueryRepository } from "../src/blogs/blogsQuery.repository";
import { container } from "../src/ioc";
import { PostsQueryRepository } from "../src/posts/postsQuery.repository";
import { UserService } from "../src/users/users.service";
import TestAgent from "supertest/lib/agent";

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

export const registerUser = async (req: TestAgent, userDto?: UserDto) => {
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

export const createUsers = async (req: TestAgent, count: number) => {
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

const userRepository = container.get(UsersRepository)

export const insertUser = async (user: User) => {
  await userRepository.createUser(user);
  return
}

export const loginUser = async (req: TestAgent, loginDto?: { loginOrEmail: string, password: string }): Promise<{ accessToken: string, refreshToken: string }> => {
  const defaultUser = testingDtosCreator.createUserDto({})
  const dto = loginDto ?? {
    loginOrEmail: defaultUser.login,
    password: defaultUser.pass,
  }
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
const postService = container.get(PostsService)
const postQueryRepo = container.get(PostsQueryRepository)
const blogService = container.get(BlogService)
const blogQueryRepo = container.get(BlogQueryRepository)
const userService = container.get(UserService)

export const testSeeder = {

  async createPosts(input: Array<PostDto>) {
    const postIds: Array<ObjectId> = [];
    const posts: Array<IPostView> = [];
    for (let i = 0; i < input.length; i++) {
      const postInput: PostInputModel = { ...input[0], blogId: new ObjectId(input[0].blogId) }
      const postId = await postService.createPost(postInput)
      postIds.push(postId)
    }
    for (const postId of postIds) {
      const post = await postQueryRepo.findPostById(postId);
      posts.push(post)
    }
    return posts
  },

  async createBlogs(input: Array<BlogInputModel>) {
    const blogs: Array<IBlogView> = [];
    const blogIds: Array<ObjectId> = [];
    for (let i = 0; i < input.length; i++) {
      const { blogId } = await blogService.createBlog(input[i])
      blogIds.push(blogId)
    }
    for (const blogId of blogIds) {
      const blog = await blogQueryRepo.findBlog(blogId);
      blogs.push(blog!)
    }
    return blogs
  },

  async createUsers(input: Array<UserInputModel>) {
    for (let i = 0; i < input.length; i++) {
      await userService.createUser(input[i])
    }
  }
}

