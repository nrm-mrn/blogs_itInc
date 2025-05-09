import { ObjectId } from "mongodb";
import { ICommentView, GetCommentsDto } from "./comments.types";
import { commentsCollection } from "../db/mongoDb";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { PagedResponse } from "../shared/types/pagination.types";
import { PostsQueryRepository } from "../posts/postsQuery.repository";
import { inject, injectable } from "inversify";

@injectable()
export class CommentsQueryRepository {

  constructor(
    @inject(PostsQueryRepository)
    private readonly postsQueryRepo: PostsQueryRepository
  ) { }

  async getCommentById(id: ObjectId): Promise<ICommentView> {
    const comment = await commentsCollection.findOne({ _id: id });
    if (!comment) {
      throw new CustomError('Comment id not found', HttpStatuses.NotFound)
    }
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: comment.commentatorInfo,
      createdAt: comment.createdAt
    }
  }

  async getComments(dto: GetCommentsDto): Promise<PagedResponse<ICommentView>> {
    const post = await this.postsQueryRepo.findPostById(dto.postId)
    if (!post) {
      throw new CustomError('Post with provided id does not exist', HttpStatuses.NotFound)
    }
    const filter = { postId: dto.postId }
    const paging = dto.paginator;
    const comments = await commentsCollection
      .find(filter)
      .sort(paging.sortBy, paging.sortDirection)
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .toArray()
    const total = await commentsCollection.countDocuments(filter)
    const commentsView = comments.map(comment => {
      return {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: comment.commentatorInfo,
        createdAt: comment.createdAt,
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
