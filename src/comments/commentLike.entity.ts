import mongoose, { HydratedDocument, Schema } from "mongoose";
import { ObjectId } from "../shared/types/objectId.type";
import { SETTINGS } from "../settings/settings";

export enum LikeStatus {
  LIKE = 'Like',
  DISLIKE = 'Dislike',
  NONE = 'None'
}

export class CommentLike {
  constructor(
    public userId: ObjectId,
    public commentId: ObjectId,
    public status: LikeStatus,
  ) { }
}

export const CommentLikeSchema = new Schema<CommentLike>({
  userId: { type: Schema.Types.ObjectId, required: true },
  commentId: { type: Schema.Types.ObjectId, required: true },
  status: { type: String, enum: LikeStatus, required: true },
},
  {
    timestamps:
    {
      createdAt: true, updatedAt: false
    }
  }
)

export const CommentLikeModel = mongoose.model<CommentLike>(SETTINGS.PATHS.COMMENTS_LIKES, CommentLikeSchema)

export type CommentLikeDocument = HydratedDocument<CommentLike>
