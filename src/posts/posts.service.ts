import { PostsRepository } from "./posts.repository";
import { PostInputModel } from "./posts.types";
import { APIErrorResult, CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { PostDocument, PostModel } from "./post.entity";
import { inject, injectable } from "inversify";
import { BlogRepository } from "../blogs/blogs.repository";
import { BlogDocument } from "../blogs/blog.entity";
import { ObjectId } from "../shared/types/objectId.type";
import mongoose from "mongoose";
import { CommentsService } from "../comments/comments.service";

@injectable()
export class PostsService {
  constructor(
    @inject(PostsRepository)
    private readonly postsRepository: PostsRepository,
    @inject(BlogRepository)
    private readonly blogRepository: BlogRepository,
    @inject(CommentsService)
    private readonly commentsService: CommentsService
  ) { }
  async getParentBlog(blogId: ObjectId): Promise<BlogDocument> {
    try {
      const blog = await this.blogRepository.getBlogById(blogId)
      return blog
    } catch (err) {
      if (err instanceof CustomError) {
        const errObj: APIErrorResult = {
          errorsMessages: [{ field: 'blogId', message: 'Wrong blogId' }]
        }
        throw new CustomError('BlogId does not exist', HttpStatuses.BadRequest, errObj)
      }
      throw err
    }
  }

  async getPost(postId: ObjectId): Promise<PostDocument> {
    return this.postsRepository.getPost(postId);
  }

  async createPost(input: PostInputModel): Promise<ObjectId> {
    const blogId = new mongoose.Types.ObjectId(input.blogId);
    const parentBlog = await this.getParentBlog(blogId)
    const newPost = new PostModel({
      ...input,
      blogId,
      blogName: parentBlog.name,
    }
    )
    const postId = await this.postsRepository.savePost(newPost);
    return postId
  }

  async editPost(id: ObjectId, input: PostInputModel): Promise<void> {
    const post = await this.postsRepository.getPost(id);
    post.title = input.title
    post.shortDescription = input.shortDescription
    post.content = input.content
    post.blogId = input.blogId

    await this.postsRepository.savePost(post)

    return;
  }

  async editPostsByBlogId(id: ObjectId, update: { blogName: string }): Promise<void> {
    return this.postsRepository.updatePostsByBlogId(id, update);
  }

  async deletePostsByBlogId(id: ObjectId): Promise<void> {
    return this.postsRepository.deletePostsByBlogId(id)
  }

  async deletePost(id: ObjectId): Promise<void> {
    const post = await this.postsRepository.getPost(id);
    const res = await this.postsRepository.deletePost(post)
    if (res) {
      await this.commentsService.deleteCommentsByPost(id)
      return
    }
    throw new Error('Failed to delete a post')
  }
}
