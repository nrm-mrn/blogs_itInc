import { ObjectId } from "../shared/types/objectId.type";
import { injectable } from "inversify";
import { CommentDocument, CommentModel } from "./comment.entity";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";

@injectable()
export class CommentsRepository {

  async save(newComment: CommentDocument): Promise<ObjectId> {
    const comment = await newComment.save();
    return comment._id
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
}
