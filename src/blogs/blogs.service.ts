import { ObjectId, WithId } from "mongodb";
import { BlogRepository } from "./blogs.repository";
import { PostsService } from "../posts/posts.service";
import { BlogPostInputModel } from "../posts/posts.types";
import { BlogInputModel, IBlogDb } from "./blogs.types";
import { Blog } from "./blog.entity";
import { inject, injectable } from "inversify";

@injectable()
export class BlogService {
  constructor(
    @inject(BlogRepository)
    private readonly blogRepository: BlogRepository,
    @inject(PostsService)
    private readonly postsService: PostsService,
  ) { };

  async createBlog(input: BlogInputModel): Promise<{ blogId: ObjectId }> {
    const newBlog = new Blog(
      input.name,
      input.description,
      input.websiteUrl,
      false
    )
    const blogId = await this.blogRepository.createBlog(newBlog)

    return { blogId }
  }

  async findBlogById(id: ObjectId): Promise<WithId<IBlogDb> | null> {
    return this.blogRepository.findBlogById(id)
  }

  async createPostForBlog(blogId: ObjectId, postInput: BlogPostInputModel): Promise<ObjectId> {
    return this.postsService.createPost({ ...postInput, blogId })
  }

  async editBlog(id: ObjectId, input: BlogInputModel): Promise<void> {
    return await this.blogRepository.editBlog(id, input)
  }

  async deleteBlog(id: ObjectId): Promise<void> {
    return this.blogRepository.deleteBlog(id)
  }
}
