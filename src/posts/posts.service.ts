import { ObjectId } from "mongodb";
import { blogQueryRepository } from "../blogs/blogsQuery.repository";
import { postsRepository } from "./posts.repository";
import { PostInputModel, PostViewModel, PostDbModel } from "./posts.types";

export const postsService = {
  async createPost(input: PostInputModel): Promise<{ post: PostViewModel | null, error: string | null }> {
    const blogId = new ObjectId(input.blogId);
    const parentBlog = await blogQueryRepository.findBlog(blogId)
    if (!parentBlog) {
      return { post: null, error: 'BlogId does not exist' }
    }
    const datetime = new Date()
    const datetimeISO = datetime.toISOString()
    const newPost: PostDbModel = {
      _id: new ObjectId(),
      blogName: parentBlog.name,
      createdAt: datetimeISO,
      ...input,
      blogId
    }
    const { post, error } = await postsRepository.createPost(newPost);
    if (!post) {
      return { post: null, error }
    }
    const { _id, ...rest } = post;
    return { post: { id: _id, ...rest }, error: null }
  },

  async editPost(id: ObjectId, input: PostInputModel): Promise<{ error: string | null }> {
    return postsRepository.editPost(id, input);
  },

  async deletePost(id: ObjectId): Promise<{ error: string | null }> {
    return postsRepository.deletePost(id)
  }
}
