import { ObjectId } from "../shared/types/objectId.type";
import { PostUpdateDto } from "./posts.types";
import { injectable } from "inversify";
import { PostDocument, PostModel } from "./post.entity";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";

@injectable()
export class PostsRepository {

  async savePost(post: PostDocument): Promise<ObjectId> {
    await post.save();
    return post._id;
  }

  async getPost(id: ObjectId): Promise<PostDocument> {
    const post = await PostModel.findOne({ _id: id }).orFail(
      new CustomError('Post does not exist', HttpStatuses.NotFound)
    )
    return post
  }

  async updatePostsByBlogId(blogId: ObjectId, input: Partial<PostUpdateDto>): Promise<void> {
    const res = await PostModel.updateMany({ "blogId": blogId }, {
      $set: {
        ...input
      }
    })
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to update posts by blogid')
  }

  async deletePostsByBlogId(blogId: ObjectId): Promise<void> {
    const res = await PostModel.deleteMany({ "blogId": blogId })
    if (res.acknowledged) {
      return
    }
    throw Error('Failed to delete posts by blogId')
  }

  async deletePost(post: PostDocument): Promise<boolean> {
    const res = await post.deleteOne()
    return res.acknowledged
  }
}
