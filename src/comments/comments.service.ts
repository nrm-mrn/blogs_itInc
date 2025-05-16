import { ObjectId } from "../shared/types/objectId.type";
import { CommentsRepository } from "./comments.repository";
import { CreateCommentDto, DeleteCommentDto, UpdateCommentDto } from "./comments.types";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { UserService } from "../users/users.service";
import { inject, injectable } from "inversify";
import { CommentatorInfo, CommentModel } from "./comment.entity";
import mongoose from "mongoose";
import { PostsRepository } from "../posts/posts.repository";

@injectable()
export class CommentsService {
  constructor(
    @inject(CommentsRepository)
    private readonly commentsRepository: CommentsRepository,
    @inject(PostsRepository)
    private readonly postsRepository: PostsRepository,
    @inject(UserService)
    private readonly userService: UserService
  ) { };

  async createComment(dto: CreateCommentDto): Promise<ObjectId> {
    await this.postsRepository.getPost(dto.postId);
    const userId = new mongoose.Types.ObjectId(dto.userId)
    const user = await this.userService.findUserById(userId)
    if (!user) {
      throw new Error('Failed to create a comment: user not found')
    }
    const commentatorInfo: CommentatorInfo = { userId: dto.userId, userLogin: user.login }
    const newComment = new CommentModel({
      postId: dto.postId,
      content: dto.content,
      commentatorInfo
    }
    )
    const commentId = await this.commentsRepository.save(newComment);
    return commentId
  }

  async updateComment(dto: UpdateCommentDto): Promise<void> {
    const comment = await this.commentsRepository.getCommentById(dto.id);
    if (comment.commentatorInfo.userId !== dto.userId) {
      throw new CustomError('Only comment creator can edit it', HttpStatuses.Forbidden)
    }
    comment.content = dto.content
    this.commentsRepository.save(comment);
    return
  }

  async deleteComment(dto: DeleteCommentDto): Promise<void> {
    const comment = await this.commentsRepository.getCommentById(dto.id);
    if (comment.commentatorInfo.userId !== dto.userId) {
      throw new CustomError('Only comment creator can delete it', HttpStatuses.Forbidden)
    }
    const res = await this.commentsRepository.deleteComment(comment);
    if (res) {
      return
    }
    throw new Error('Failed to delete a comment')
  }

  async deleteCommentsByPost(postId: ObjectId): Promise<void> {
    return this.commentsRepository.deleteCommentsByPost(postId);
  }
}
