import { ObjectId, WithId } from "mongodb";
import { blogsCollection } from "../db/mongoDb";
import { PostsRepository } from "../posts/posts.repository";
import { BlogInputModel, IBlogDb } from "./blogs.types";
import { Blog } from "./blog.entity";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { inject, injectable } from "inversify";

@injectable()
export class BlogRepository {
  constructor(
    @inject(PostsRepository)
    private readonly postsRepository: PostsRepository
  ) { }

  async createBlog(newBlog: Blog): Promise<ObjectId> {
    const insertRes = await blogsCollection.insertOne(newBlog)
    if (insertRes.acknowledged) {
      return insertRes.insertedId
    }
    throw new Error('Failed to insert a blog in db')
  }

  async findBlogById(id: ObjectId): Promise<WithId<IBlogDb> | null> {
    return blogsCollection.findOne({ _id: id })
  }

  async editBlog(id: ObjectId, input: BlogInputModel): Promise<void> {
    const target = await this.findBlogById(id);
    if (!target) {
      throw new CustomError('blog does not exist', HttpStatuses.NotFound)
    }
    await blogsCollection.updateOne({ _id: id }, { $set: { ...input } })
    if (target.name !== input.name) {
      await this.postsRepository.updatePostsByBlogId(id, { blogName: input.name })
    }
    return;
  }

  async deleteBlog(id: ObjectId): Promise<void> {
    const target = await this.findBlogById(id);
    if (!target) {
      throw new CustomError('Blog does not exist', HttpStatuses.NotFound)
    }
    const res = await blogsCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      await this.postsRepository.deletePostsByBlogId(id)
      return;
    }
    throw new Error('Failed to delete a blog')
  }
}
