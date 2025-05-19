import { ObjectId } from "../shared/types/objectId.type";
import { injectable } from "inversify";
import { CommentDocument, CommentModel } from "./comment.entity";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { CommentLikeDocument, CommentLikeModel } from "./commentLike.entity";

@injectable()
export class CommentsRepository {

  async save(doc: CommentDocument | CommentLikeDocument): Promise<ObjectId> {
    const savedDoc = await doc.save();
    return savedDoc._id
  }

  async getCommentById(id: ObjectId): Promise<CommentDocument> {
    const comment = await CommentModel.findById(id).orFail(
      new CustomError('Comment was not found', HttpStatuses.NotFound)
    )
    return comment
  }

  async deleteComment(comment: CommentDocument): Promise<boolean> {
    const res = await comment.deleteOne()
    return res.acknowledged
  }

  async deleteCommentsByPost(postId: ObjectId): Promise<void> {
    const res = await CommentModel.deleteMany({ postId });
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to delete comments for a post')
  }

  async findCommLikeByUser(commentId: ObjectId, userId: ObjectId): Promise<CommentLikeDocument | null> {
    const like = await CommentLikeModel.findOne({
      commentId,
      userId
    }).exec()
    return like
  }

  async deleteLikesByComment(commentId: ObjectId): Promise<void> {
    const res = await CommentLikeModel.deleteMany({ commentId })
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to delete likes by commentId')
  }
}
