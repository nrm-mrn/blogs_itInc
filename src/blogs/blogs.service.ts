import { ObjectId } from "../shared/types/objectId.type";
import { BlogRepository } from "./blogs.repository";
import { PostsService } from "../posts/application/posts.service";
import { BlogInputModel, BlogPostInputModel } from "./blogs.types";
import { BlogModel } from "./blog.entity";
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
    const newBlog = new BlogModel({
      ...input,
      isMembership: false
    })

    const blogId = await this.blogRepository.save(newBlog)

    return { blogId }
  }

  async createPostForBlog(blogId: ObjectId, postInput: BlogPostInputModel): Promise<ObjectId> {
    return this.postsService.createPost({ ...postInput, blogId })
  }

  async editBlog(id: ObjectId, input: BlogInputModel): Promise<void> {
    const blog = await this.blogRepository.getBlogById(id);
    if (blog.name !== input.name) {
      await this.postsService.editPostsByBlogId(
        { id, blogName: input.name }
      )
    }
    blog.name = input.name;
    blog.description = input.description;
    blog.websiteUrl = input.websiteUrl;
    await this.blogRepository.save(blog)
    return
  }

  async deleteBlog(id: ObjectId): Promise<void> {
    const blog = await this.blogRepository.getBlogById(id)
    const res = await this.blogRepository.deleteBlog(blog)
    if (res) {
      await this.postsService.deletePostsByBlogId(id)
      return
    }
    throw new Error('Failed to delete a blog')
  }
}
