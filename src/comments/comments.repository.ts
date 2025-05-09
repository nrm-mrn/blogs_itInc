import { ObjectId } from "mongodb";
import { UpdateCommentDto } from "./comments.types";
import { commentsCollection } from "../db/mongoDb";
import { injectable } from "inversify";
import { Comment } from "./comment.entity";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";

@injectable()
export class CommentsRepository {

  async createComment(newComment: Comment): Promise<{ commentId: ObjectId }> {
    const insertRes = await commentsCollection.insertOne(newComment);
    if (insertRes.acknowledged) {
      return { commentId: insertRes.insertedId }
    }
    throw new Error('Failed to create a comment')
  }

  async editComment(dto: UpdateCommentDto): Promise<void> {
    const res = await commentsCollection.updateOne({ _id: dto.id }, {
      $set: { content: dto.content }
    })
    if (res.modifiedCount !== 1) {
      throw new CustomError('Comment was not found', HttpStatuses.NotFound)
    }
    return
  }

  async deleteComment(id: ObjectId): Promise<void> {
    const res = await commentsCollection.deleteOne({ _id: id })
    if (res.deletedCount !== 1) {
      throw new CustomError('Comment was not found', HttpStatuses.NotFound)
    }
    return;
  }

  async deleteCommentsByPost(postId: ObjectId): Promise<void> {
    const res = await commentsCollection.deleteMany({ postId });
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to delete comments for a post')
  }
}
