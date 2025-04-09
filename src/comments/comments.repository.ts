import { ObjectId } from "mongodb";
import { CommentDbModel, UpdateCommentDto } from "./comments.types";
import { commentsCollection } from "../db/mongoDb";
import { commentsQueryRepository } from "./commentsQuery.repository";

export const commentsRepository = {

  async createComment(newComment: CommentDbModel): Promise<{ commentId: ObjectId }> {
    const insertRes = await commentsCollection.insertOne(newComment);
    if (insertRes.acknowledged) {
      return { commentId: insertRes.insertedId }
    }
    throw new Error('Failed to create a comment')
  },

  async editComment(dto: UpdateCommentDto): Promise<void> {
    const target = await commentsQueryRepository.getCommentById(dto.id);
    const res = await commentsCollection.updateOne({ _id: dto.id }, {
      $set: { content: dto.content }
    })
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to update a comment')
  },

  async deleteComment(id: ObjectId): Promise<void> {
    const comment = await commentsQueryRepository.getCommentById(id)
    const res = await commentsCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to delete a comment')
  },

  async deleteCommentsByPost(postId: ObjectId): Promise<void> {
    const res = await commentsCollection.deleteMany({ postId });
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to delete comments for a post')
  }
}
