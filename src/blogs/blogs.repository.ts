import { ObjectId } from "../shared/types/objectId.type";
import { BlogDocument, BlogModel } from "./blog.entity";
import { injectable } from "inversify";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";

@injectable()
export class BlogRepository {
  async save(newBlog: BlogDocument): Promise<ObjectId> {
    await newBlog.save();
    return newBlog._id;
  }

  async getBlogById(id: ObjectId): Promise<BlogDocument> {
    const blog = await BlogModel.findOne({ _id: id }).orFail(
      new CustomError('blog does not exist', HttpStatuses.NotFound)
    )
    return blog
  }

  async deleteBlog(blog: BlogDocument): Promise<boolean> {
    const res = await blog.deleteOne()
    if (res.acknowledged) {
      return true
    }
    throw new Error('Failed to delete a blog')
  }
}
