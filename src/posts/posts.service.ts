import { ObjectId } from "mongodb";
import { PostsRepository } from "./posts.repository";
import { PostInputModel } from "./posts.types";
import { APIErrorResult, CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { Post } from "./post.entity";
import { inject, injectable } from "inversify";
import { BlogRepository } from "../blogs/blogs.repository";

@injectable()
export class PostsService {
  constructor(
    @inject(PostsRepository)
    private readonly postsRepository: PostsRepository,
    @inject(BlogRepository)
    private readonly blogRepository: BlogRepository
  ) { }
  async createPost(input: PostInputModel): Promise<ObjectId> {
    const blogId = new ObjectId(input.blogId);
    const parentBlog = await this.blogRepository.findBlogById(blogId)
    if (!parentBlog) {
      const errObj: APIErrorResult = {
        errorsMessages: [{ field: 'blogId', message: 'Wrong blogId' }]
      }
      throw new CustomError('BlogId does not exist', HttpStatuses.BadRequest, errObj)
    }
    const newPost = new Post(
      input.title,
      input.shortDescription,
      input.content,
      blogId,
      parentBlog.name,
    )
    const postId = await this.postsRepository.createPost(newPost);
    return postId
  }

  async editPost(id: ObjectId, input: PostInputModel): Promise<void> {
    const post = await this.postsRepository.getPost(id);
    if (!post) {
      throw new CustomError('Post does not exist', HttpStatuses.NotFound)
    }
    await this.postsRepository.editPost(id, input);
    return;
  }

  async deletePost(id: ObjectId): Promise<void> {
    const post = await this.postsRepository.getPost(id);
    if (!post) {
      throw new CustomError('Post does not exist', HttpStatuses.NotFound)
    }
    await this.postsRepository.deletePost(id)
    return;
  }
}
