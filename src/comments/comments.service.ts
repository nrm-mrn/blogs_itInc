import { ObjectId } from "mongodb";
import { commentsRepository } from "./comments.repository";
import { CommentDbModel, CommentViewModel, CreateCommentDto, DeleteCommentDto, UpdateCommentDto } from "./comments.types";
import { commentsQueryRepository } from "./commentsQuery.repository";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { postsQueryRepository } from "../posts/postsQuery.repository";
import { userService } from "../users/users.service";

export const commentsService = {
  async createComment(dto: CreateCommentDto): Promise<{ data: CommentViewModel }> {
    const targetPost = await postsQueryRepository.findPostById(dto.postId);
    if (!targetPost) {
      throw new CustomError('Post with provided id does not exist', HttpStatuses.NotFound)
    }
    const userId = new ObjectId(dto.userId)
    const user = await userService.getUserById(userId)
    if (!user) {
      throw new Error('Failed to create a comment: user not found')
    }
    const dt = new Date()
    const dtISO = dt.toISOString();
    const input: CommentDbModel = {
      postId: dto.postId,
      content: dto.content,
      commentatorInfo: { userId: dto.userId, userLogin: user.login },
      createdAt: dtISO,
    }
    const { commentId } = await commentsRepository.createComment(input);
    const { data } = await commentsQueryRepository.getCommentById(commentId)
    return { data }
  },

  async updateComment(dto: UpdateCommentDto): Promise<void> {
    const { data } = await commentsQueryRepository.getCommentById(dto.id);
    if (data.commentatorInfo.userId !== dto.userId) {
      throw new CustomError('Only comment creator can edit it', HttpStatuses.Forbidden)
    }
    return commentsRepository.editComment(dto);
  },

  async deleteComment(dto: DeleteCommentDto): Promise<void> {
    const { data } = await commentsQueryRepository.getCommentById(dto.id);
    if (data.commentatorInfo.userId !== dto.userId) {
      throw new CustomError('Only comment creator can delete it', HttpStatuses.Forbidden)
    }
    return commentsRepository.deleteComment(dto.id);
  }
}
