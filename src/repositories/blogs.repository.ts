import { db } from "../db/db";
import { BlogInputModel, BlogViewModel } from "../db/db-types";
import { postsRepository } from "./posts.repository";

export const blogRepository = {

  async createBlog(input: BlogInputModel): Promise<{ blog: BlogViewModel | null, error: string | null }> {
    const newBlog: BlogViewModel = {
      id: (Date.now() + Math.random()).toString(),
      ...input
    }
    try {
      db.blogs = [...db.blogs, newBlog]
    } catch (e: any) {
      return { blog: null, error: e.message }
    }

    return { blog: newBlog, error: null }
  },

  async findBlog(id: string): Promise<BlogViewModel | undefined> {
    return db.blogs.find(b => b.id === id);
  },

  async editBlog(id: string, input: BlogInputModel): Promise<{ error: string } | undefined> {
    const target = await this.findBlog(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const updatedBlog = { id: target.id, ...input }
    const targetIdx = db.blogs.findIndex(b => b.id === id);
    db.blogs.splice(targetIdx, 1, updatedBlog)
    if (target.name !== input.name) {
      postsRepository.updatePostsByBlogId(id, { blogName: updatedBlog.name })
    }
    return
  },

  async deleteBlog(id: string): Promise<{ error: string } | undefined> {
    const targetIdx = db.blogs.findIndex(b => b.id === id)
    if (targetIdx < 0) {
      return { error: 'Id does not exist' }
    }
    db.blogs.splice(targetIdx, 1);
    postsRepository.deletePostsByBlogId(id)
    return
  }
}
