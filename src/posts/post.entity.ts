import mongoose, { HydratedDocument, Schema } from "mongoose"
import { SETTINGS } from "../settings/settings"
import { ObjectId } from "../shared/types/objectId.type"

export class Post {
  createdAt: Date
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: ObjectId,
    public blogName: string,
  ) {
    this.createdAt = new Date();
  }
}

export const PostSchema = new mongoose.Schema<Post>({
  title: { type: String, required: true },
  shortDescription: { type: String, required: true },
  content: { type: String, required: true },
  blogId: { type: Schema.Types.ObjectId, required: true },
  blogName: { type: String, required: true },
},
  {
    timestamps: { createdAt: true, updatedAt: false }
  })

export const PostModel = mongoose.model<Post>(SETTINGS.PATHS.POSTS, PostSchema)

export type PostDocument = HydratedDocument<Post>;
