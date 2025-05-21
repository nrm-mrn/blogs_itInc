import { PostsRepository } from "../infrastructure/posts.repository";
import { APIErrorResult, CustomError } from "../../shared/types/error.types";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { inject, injectable } from "inversify";
import { BlogRepository } from "../../blogs/blogs.repository";
import { BlogDocument } from "../../blogs/blog.entity";
import { ObjectId } from "../../shared/types/objectId.type";
import { CommentsService } from "../../comments/comments.service";
import { PostDocument, PostModel } from "../domain/post.entity";
import { CreatePostDto, CreatePostLikeDto, EditPostByBlog } from "./posts.dto";

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

  async createPost(input: CreatePostDto): Promise<ObjectId> {
    await this.getParentBlog(input.blogId)
    const newPost = await PostModel.createPost(input);
    const postId = await this.postsRepository.saveDoc(newPost);
    return postId
  }

  async editPost(id: ObjectId, input: CreatePostDto): Promise<void> {
    const post = await this.postsRepository.getPost(id);
    post.updatePost(input);
    await this.postsRepository.saveDoc(post)
    return;
  }

  async handlePostLike(likeDto: CreatePostLikeDto): Promise<void> {
    const post = await this.postsRepository.getPost(likeDto.postId);
    const like = await post.handleLike(likeDto);
    if (like) {
      await this.postsRepository.saveDoc(like);
      await post.updateNewestLikes();
      await this.postsRepository.saveDoc(post);
      return
    }
    return
  }

  async editPostsByBlogId(update: EditPostByBlog): Promise<void> {
    return this.postsRepository.updatePostsByBlogId(update);
  }

  async deletePostsByBlogId(id: ObjectId): Promise<void> {
    return this.postsRepository.deletePostsByBlogId(id)
  }

  async deletePost(id: ObjectId): Promise<void> {
    const post = await this.postsRepository.getPost(id);
    const res = await this.postsRepository.deletePost(post)
    if (res) {
      await Promise.all([
        this.postsRepository.deleteLikesByPost(id),
        this.commentsService.deleteCommentsByPost(id)
      ])
      return
    }
    throw new Error('Failed to delete a post')
  }
}
