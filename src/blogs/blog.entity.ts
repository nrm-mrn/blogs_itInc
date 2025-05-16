import mongoose, { HydratedDocument } from "mongoose"
import { SETTINGS } from "../settings/settings"

export class Blog {
  createdAt: Date

  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
    public isMembership: boolean) {
    this.createdAt = new Date();
  }
}

export const BlogSchema = new mongoose.Schema<Blog>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  isMembership: { type: Boolean, required: true },
},
  {
    timestamps: { createdAt: true, updatedAt: false }
  })

export const BlogModel = mongoose.model<Blog>(SETTINGS.PATHS.BLOGS, BlogSchema)

export type BlogDocument = HydratedDocument<Blog>;
