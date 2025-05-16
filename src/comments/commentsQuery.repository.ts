import { ObjectId } from "../shared/types/objectId.type";
import { ICommentView, GetCommentsDto } from "./comments.types";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { PagedResponse } from "../shared/types/pagination.types";
import { injectable } from "inversify";
import { CommentModel } from "./comment.entity";
import { PostModel } from "../posts/post.entity";

@injectable()
export class CommentsQueryRepository {

  async getCommentById(id: ObjectId): Promise<ICommentView> {
    const comment = await CommentModel.findOne({ _id: id });
    if (!comment) {
      throw new CustomError('Comment id not found', HttpStatuses.NotFound)
    }
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: comment.commentatorInfo,
      createdAt: comment.createdAt.toISOString()
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
    const commentsView: ICommentView[] = comments.map(comment => {
      return {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: comment.commentatorInfo,
        createdAt: comment.createdAt.toISOString(),
      }
    })
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: commentsView,
    }
  }
}
