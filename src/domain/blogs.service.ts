import { ObjectId } from "mongodb";
import { BlogDbModel, BlogInputModel, BlogViewModel } from "../db/db-types";
import { blogRepository } from "../repositories/blogs.repository";

export const blogService = {
  async createBlog(input: BlogInputModel): Promise<{ newBlog: BlogViewModel | null, error: string | null }> {
    const datetime = new Date()
    const datetimeISO = datetime.toISOString()
    const newBlog: BlogDbModel = {
      _id: new ObjectId(),
      isMembership: false,
      createdAt: datetimeISO,
      ...input
    }
    const { error } = await blogRepository.createBlog(newBlog)

    if (!error) {
      const { _id, ...rest } = newBlog;
      const newBlogView: BlogViewModel = { id: _id, ...rest }
      return { newBlog: newBlogView, error: null }
    }
    return { newBlog: null, error: 'Failed to create a blog' }
  },

  async editBlog(id: ObjectId, input: BlogInputModel): Promise<{ error: string | null }> {

    return await blogRepository.editBlog(id, input)

  },

  async deleteBlog(id: ObjectId): Promise<{ error: string | null }> {
    return blogRepository.deleteBlog(id)
  }
}
