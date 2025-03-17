import { ObjectId } from "mongodb";
import { PostDbModel, PostInputModel, PostViewModel } from "../db/db-types";
import { blogsCollection, postsCollection } from "../db/mongoDb";

export const postsRepository = {

  async getAllPosts(): Promise<Array<PostDbModel>> {
    const posts = postsCollection.find({}).toArray()
    return posts
  },

  async createPost(input: PostInputModel): Promise<{ post: PostDbModel | null, error: string | null }> {
    const blogId = new ObjectId(input.blogId);
    const parentBlog = await blogsCollection.findOne({ _id: blogId })
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
    const insertRes = await postsCollection.insertOne(newPost);
    if (insertRes.acknowledged) {
      return { post: newPost, error: null }
    }
    return { post: null, error: 'failed to create a post' }
  },

  async findPostById(id: ObjectId): Promise<PostDbModel | null> {
    const post = postsCollection.findOne({ _id: id })
    return post
  },

  async editPost(id: ObjectId, input: PostInputModel): Promise<{ error: string } | undefined> {
    const target = await this.findPostById(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const res = await postsCollection.updateOne({ _id: id }, {
      $set: { ...input }
    })
    if (res.acknowledged) {
      return
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

  async findPostsByBlogId(blogId: ObjectId): Promise<Array<PostDbModel>> {
    const posts = postsCollection.find({ blogId: blogId }).toArray()
    return posts
  },

  async deletePostsByBlogId(blogId: ObjectId): Promise<{ error: string } | undefined> {
    const res = await postsCollection.deleteMany({ "blogId": blogId })
    if (res.acknowledged) {
      return
    }
    return { error: 'Deletion failed' }
  },

  async deletePost(id: ObjectId): Promise<{ error: string } | undefined> {
    const res = await postsCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      return
    }
    return { error: 'Deletion failed' }
  }
}
