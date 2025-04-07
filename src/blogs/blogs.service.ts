import { ObjectId } from "mongodb";
import { BlogDbModel, BlogInputModel, BlogPostInputModel, BlogViewModel, PostViewModel } from "../db/db-types";
import { blogRepository } from "./blogs.repository";
import { postsService } from "../posts/posts.service";

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

  async createPostForBlog(blogId: ObjectId, postInput: BlogPostInputModel): Promise<{ post: PostViewModel | null, error: string | null }> {
    return postsService.createPost({ ...postInput, blogId })
  },

  async editBlog(id: ObjectId, input: BlogInputModel): Promise<{ error: string | null }> {

    return await blogRepository.editBlog(id, input)

  },

  async deleteBlog(id: ObjectId): Promise<{ error: string | null }> {
    return blogRepository.deleteBlog(id)
  }
}
