import { ObjectId } from "../shared/types/objectId.type";
import { CommentsRepository } from "./comments.repository";
import { CreateCommentDto, DeleteCommentDto, LikeInputDto, UpdateCommentDto } from "./comments.types";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { UserService } from "../users/users.service";
import { inject, injectable } from "inversify";
import { Comment, CommentatorInfo, CommentDocument, CommentModel } from "./comment.entity";
import mongoose from "mongoose";
import { PostsRepository } from "../posts/posts.repository";
import { CommentLike, CommentLikeDocument, CommentLikeModel, LikeStatus } from "./commentLike.entity";

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
    const commentInst = new Comment(
      dto.postId,
      dto.content,
      commentatorInfo
    )
    const newComment = new CommentModel({
      ...commentInst
    })
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
    await Promise.all([
      await this.commentsRepository.deleteComment(comment),
      await this.commentsRepository.deleteLikesByComment(comment._id),
    ])
  }

  async deleteCommentsByPost(postId: ObjectId): Promise<void> {
    return this.commentsRepository.deleteCommentsByPost(postId);
  }

  async handleCommentLike(dto: LikeInputDto): Promise<void> {
    const [comment, like] = await Promise.all([
      this.commentsRepository.getCommentById(dto.commentId),
      this.commentsRepository.findCommLikeByUser(
        dto.commentId,
        dto.userId
      )
    ])
    if (like) {
      await this.updateCommentLike(comment, like, dto)
      return
    }
    await this.createCommentLike(comment, dto)
    return
  }

  private async createCommentLike(
    comment: CommentDocument,
    dto: LikeInputDto): Promise<void> {
    switch (dto.status) {
      case LikeStatus.LIKE: {
        comment.likesCount += 1;
        break
      }
      case LikeStatus.DISLIKE: {
        comment.dislikesCount += 1;
        break
      }
    }
    const likeInst = new CommentLike(
      dto.userId,
      dto.commentId,
      dto.status
    )
    const newLike = new CommentLikeModel({
      ...likeInst
    })
    await Promise.all([
      this.commentsRepository.save(newLike),
      this.commentsRepository.save(comment)
    ])
    return
  }

  private async updateCommentLike(
    comment: CommentDocument,
    like: CommentLikeDocument,
    dto: LikeInputDto): Promise<void> {
    if (like.status !== dto.status) {
      switch (like.status) {
        case LikeStatus.LIKE: {
          comment.likesCount -= 1
          if (dto.status === LikeStatus.DISLIKE) {
            comment.dislikesCount += 1
          }
          break;
        }
        case LikeStatus.DISLIKE: {
          comment.dislikesCount -= 1;
          if (dto.status === LikeStatus.LIKE) {
            comment.likesCount += 1;
          }
          break;
        }
        case LikeStatus.NONE: {
          if (dto.status === LikeStatus.LIKE) {
            comment.likesCount += 1;
            break
          }
          comment.dislikesCount += 1;
          break;
        }
      }
      like.status = dto.status
      await Promise.all([
        this.commentsRepository.save(like),
        this.commentsRepository.save(comment)
      ])
    }
    return
  }
}
