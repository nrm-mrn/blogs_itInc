import { ObjectId } from "mongodb";
import { BlogDbModel, BlogInputModel, BlogViewModel } from "../db/db-types";
import { blogsCollection } from "../db/mongoDb";
import { postsRepository } from "./posts.repository";

export const blogRepository = {

  async getAllBlogs(): Promise<Array<BlogDbModel>> {
    const blogs = await blogsCollection.find({}).toArray();
    return blogs
  },

  async createBlog(input: BlogInputModel): Promise<{ newBlog: BlogDbModel | null, error: string | null }> {
    const datetime = new Date()
    const datetimeISO = datetime.toISOString()
    const newBlog: BlogDbModel = {
      _id: new ObjectId(),
      isMembership: false,
      createdAt: datetimeISO,
      ...input
    }
    const insertRes = await blogsCollection.insertOne(newBlog)
    if (insertRes.acknowledged) {
      return { newBlog, error: null }
    }
    return { newBlog: null, error: 'Failed to create a blog' }
  },

  async findBlog(id: ObjectId): Promise<BlogDbModel | null> {
    const blog = blogsCollection.findOne({ _id: id })
    return blog
  },

  async editBlog(id: ObjectId, input: BlogInputModel): Promise<{ error: string } | undefined> {
    const target = await this.findBlog(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const res = await blogsCollection.updateOne({ _id: id }, { $set: { ...input } })

    if (target.name !== input.name) {
      await postsRepository.updatePostsByBlogId(id, { blogName: input.name })
    }
    return
  },

  async deleteBlog(id: ObjectId): Promise<{ error: string } | undefined> {
    const target = await this.findBlog(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const res = await blogsCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      await postsRepository.deletePostsByBlogId(id)
      return
    }
    return { error: 'failed to delete the blog' }
  }
}
