import { ObjectId } from "mongodb";
import { PostDbModel, PostInputModel, PostViewModel } from "../db/db-types";
import { postsCollection } from "../db/mongoDb";
import { postsQueryRepository } from "./postsQuery.repository";

export const postsRepository = {

  async createPost(newPost: PostDbModel): Promise<{ post: PostDbModel | null, error: string | null }> {
    const insertRes = await postsCollection.insertOne(newPost);
    if (insertRes.acknowledged) {
      return { post: newPost, error: null }
    }
    return { post: null, error: 'failed to create a post' }
  },

  async editPost(id: ObjectId, input: PostInputModel): Promise<{ error: string | null }> {
    const target = await postsQueryRepository.findPostById(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const res = await postsCollection.updateOne({ _id: id }, {
      $set: { ...input, blogId: new ObjectId(input.blogId) }
    })
    if (res.acknowledged) {
      return { error: null }
    }
    return { error: 'Update failed' }
  },

  async updatePostsByBlogId(blogId: ObjectId, input: Partial<PostViewModel>): Promise<{ error: string } | undefined> {
    const res = await postsCollection.updateMany({ "blogId": blogId }, {
      $set: { ...input }
    })
    if (res.acknowledged) {
      return
    }
    return { error: 'Update failed' }
  },

  async deletePostsByBlogId(blogId: ObjectId): Promise<{ error: string } | undefined> {
    const res = await postsCollection.deleteMany({ "blogId": blogId })
    if (res.acknowledged) {
      return
    }
    return { error: 'Deletion failed' }
  },

  async deletePost(id: ObjectId): Promise<{ error: string | null }> {
    const post = await postsQueryRepository.findPostById(id)
    if (!post) {
      return { error: 'post not found' }
    }
    const res = await postsCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      return { error: null }
    }
    return { error: 'Deletion failed' }
  }
}
