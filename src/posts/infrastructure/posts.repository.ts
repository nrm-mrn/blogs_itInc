import { ObjectId } from "../../shared/types/objectId.type";
import { injectable } from "inversify";
import { CustomError } from "../../shared/types/error.types";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { EditPostByBlog } from "../application/posts.dto";
import { PostDocument, PostModel } from "../domain/post.entity";
import { PostLikeDocument, PostLikeModel } from "../domain/postLike.entity";

@injectable()
export class PostsRepository {

  async saveDoc(doc: PostDocument | PostLikeDocument): Promise<ObjectId> {
    await doc.save();
    return doc._id;
  }

  async getPost(id: ObjectId): Promise<PostDocument> {
    const post = await PostModel.findOne({ _id: id }).orFail(
      new CustomError('Post does not exist', HttpStatuses.NotFound)
    )
    return post
  }

  async updatePostsByBlogId(input: EditPostByBlog): Promise<void> {
    const { id: blogId, ...update } = input
    const res = await PostModel.updateMany({ "blogId": blogId }, {
      $set: {
        ...update
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

  async deleteLikesByPost(postId: ObjectId): Promise<void> {
    const res = await PostLikeModel.deleteMany({ postId });
    if (res.acknowledged) {
      return
    }
    throw new Error('Failed to delete likes by post')
  }
}
