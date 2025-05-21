import { ObjectId } from "../shared/types/objectId.type";
import { ICommentView, GetCommentsDto, ILikesInfoView } from "./comments.types";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { PagedResponse } from "../shared/types/pagination.types";
import { injectable } from "inversify";
import { CommentModel } from "./comment.entity";
import { CommentLikeModel, CommentLikeStatus } from "./commentLike.entity";
import { PostModel } from "../posts/domain/post.entity";

@injectable()
export class CommentsQueryRepository {

  async getCommentById(id: ObjectId, userId?: ObjectId): Promise<ICommentView> {
    const comment = await CommentModel.findOne({ _id: id });
    if (!comment) {
      throw new CustomError('Comment id not found', HttpStatuses.NotFound)
    }
    let likesInfo: ILikesInfoView = {
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
      myStatus: CommentLikeStatus.NONE,
    }
    if (userId) {
      const like = await CommentLikeModel.findOne(
        { commentId: comment._id, userId }
      )
      if (like) {
        likesInfo.myStatus = like.status
      }
    }
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo
    }
  }

  async getComments(dto: GetCommentsDto): Promise<PagedResponse<ICommentView>> {
    await PostModel.findById(dto.postId).orFail(
      new CustomError('Post with provided id does not exist', HttpStatuses.NotFound)
    )
    const filter = { postId: dto.postId }
    const paging = dto.paginator;
    const comments = await CommentModel
      .find(filter)
      .sort({ [paging.sortBy]: paging.sortDirection })
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .exec();
    const total = await CommentModel.countDocuments(filter).exec();

    //WARN: might be dangerous if pageSize gets > 1000
    const commentsView: ICommentView[] = await Promise.all(
      comments.map(async comment => {
        const likesInfo: ILikesInfoView = {
          likesCount: comment.likesCount,
          dislikesCount: comment.dislikesCount,
          myStatus: CommentLikeStatus.NONE
        }
        if (dto.userId) {
          const like = await CommentLikeModel.findOne({
            commentId: comment._id,
            userId: dto.userId
          })
          if (like) {
            likesInfo.myStatus = like.status
          }
        }
        return {
          id: comment._id.toString(),
          content: comment.content,
          commentatorInfo: {
            userId: comment.commentatorInfo.userId,
            userLogin: comment.commentatorInfo.userLogin
          },
          createdAt: comment.createdAt.toISOString(),
          likesInfo
        }
      })
    )
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: commentsView,
    }
  }
}
