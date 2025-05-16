import { ObjectId } from "../shared/types/objectId.type";
import mongoose, { HydratedDocument, Schema } from "mongoose";
import { SETTINGS } from "../settings/settings";

export class Comment {
  createdAt: Date
  constructor(
    public postId: ObjectId,
    public content: string,
    public commentatorInfo: CommentatorInfo,
  ) {
    this.createdAt = new Date()
  }
}

export interface CommentatorInfo {
  userId: string;
  userLogin: string;
}

export const CommentatorInfoSchema = new Schema<CommentatorInfo>({
  userId: { type: String, required: true },
  userLogin: { type: String, required: true },
})

export const CommentSchema = new mongoose.Schema<Comment>({
  postId: { type: Schema.Types.ObjectId, required: true },
  content: { type: String, required: true },
  commentatorInfo: { type: CommentatorInfoSchema, required: true },
},
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

export const CommentModel = mongoose.model<Comment>(SETTINGS.PATHS.COMMENTS, CommentSchema)

export type CommentDocument = HydratedDocument<Comment>
