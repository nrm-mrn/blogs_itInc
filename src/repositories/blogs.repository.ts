import { ObjectId } from "mongodb";
import { BlogDbModel, BlogInputModel } from "../db/db-types";
import { blogsCollection } from "../db/mongoDb";
import { postsRepository } from "./posts.repository";
import { blogQueryRepository } from "./blogsQuery.repository";

export const blogRepository = {

  async createBlog(newBlog: BlogDbModel): Promise<{ error: string | null }> {
    const insertRes = await blogsCollection.insertOne(newBlog)
    if (insertRes.acknowledged) {
      return { error: null }
    }
    return { error: 'Failed to create a blog' }
  },

  async editBlog(id: ObjectId, input: BlogInputModel): Promise<{ error: string | null }> {
    const target = await blogQueryRepository.findBlog(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const res = await blogsCollection.updateOne({ _id: id }, { $set: { ...input } })

    if (target.name !== input.name) {
      await postsRepository.updatePostsByBlogId(id, { blogName: input.name })
    }
    return { error: null }
  },

  async deleteBlog(id: ObjectId): Promise<{ error: string | null }> {
    const target = await blogQueryRepository.findBlog(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const res = await blogsCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      await postsRepository.deletePostsByBlogId(id)
      return { error: null }
    }
    return { error: 'failed to delete the blog' }
  }
}
