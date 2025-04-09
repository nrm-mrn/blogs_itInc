import { ObjectId } from "mongodb";
import { CommentViewModel, GetCommentsDto } from "./comments.types";
import { commentsCollection } from "../db/mongoDb";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { PagedResponse } from "../shared/types/pagination.types";
import { postsQueryRepository } from "../posts/postsQuery.repository";

export const commentsQueryRepository = {

  async getCommentById(id: ObjectId): Promise<{ data: CommentViewModel }> {
    const comment = await commentsCollection.findOne({ _id: id });
    if (!comment) {
      throw new CustomError('Comment id not found', HttpStatuses.NotFound)
    }
    const { _id, postId, ...rest } = comment
    const result = { data: { id: _id, ...rest } }
    return result
  },

  async getComments(dto: GetCommentsDto): Promise<PagedResponse<CommentViewModel>> {
    const post = await postsQueryRepository.findPostById(dto.postId)
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
      const { _id, postId, ...rest } = comment
      return { id: _id, ...rest }
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
