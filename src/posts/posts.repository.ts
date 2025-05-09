import { ObjectId } from "mongodb";
import { postsCollection } from "../db/mongoDb";
import { CommentsRepository } from "../comments/comments.repository";
import { IPostDb, PostInputModel, PostUpdateDto } from "./posts.types";
import { inject, injectable } from "inversify";
import { Post } from "./post.entity";

@injectable()
export class PostsRepository {

  constructor(
    @inject(CommentsRepository)
    private readonly commentsRepository: CommentsRepository) { };

  async createPost(newPost: Post): Promise<ObjectId> {
    const insertRes = await postsCollection.insertOne(newPost);
    if (insertRes.acknowledged) {
      return insertRes.insertedId
    }
    throw new Error('Failed to create a post')
  }

  async getPost(id: ObjectId): Promise<IPostDb | null> {
    const post = await postsCollection.findOne({ _id: id })
    if (!post) {
      return null
    }
    return post
  }

  async editPost(id: ObjectId, input: PostInputModel): Promise<void> {
    const res = await postsCollection.updateOne({ _id: id }, {
      $set: { ...input, blogId: new ObjectId(input.blogId) }
    })
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to update post')
  }

  async updatePostsByBlogId(blogId: ObjectId, input: Partial<PostUpdateDto>): Promise<void> {
    const res = await postsCollection.updateMany({ "blogId": blogId }, {
      $set: {
        ...input
      }
    })
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to update posts by blogid')
  }

  async deletePostsByBlogId(blogId: ObjectId): Promise<{ error: string } | undefined> {
    const res = await postsCollection.deleteMany({ "blogId": blogId })
    if (res.acknowledged) {
      return
    }
    return { error: 'Deletion failed' }
  }

  async deletePost(id: ObjectId): Promise<void> {
    await this.commentsRepository.deleteCommentsByPost(id)
    const res = await postsCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to delete a post')
  }
}
