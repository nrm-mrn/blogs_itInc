import { ObjectId } from "../../shared/types/objectId.type";
import { PagedResponse } from "../../shared/types/pagination.types";
import { CustomError } from "../../shared/types/error.types";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { IExtendedLikesInfo, IPostView } from "../api/posts.api.models";
import { PostModel } from "../domain/post.entity";
import { GetPostsDto } from "./postsQuery.models";
import { PostLikeModel } from "../domain/postLike.entity";
import { PostLikeStatus } from "../application/posts.dto";

export class PostsQueryRepository {

  async getAllPosts(dto: GetPostsDto): Promise<PagedResponse<IPostView>> {
    const paging = dto.pagination
    const posts = await PostModel
      .find({})
      .sort({ [paging.sortBy]: paging.sortDirection })
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .exec()
    const total = await PostModel.countDocuments();
    const postsView: IPostView[] = posts.map(post => {
      const extendedLikesInfo: IExtendedLikesInfo = {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: PostLikeStatus.NONE,
        newestLikes: post.newestLikes,
      }
      return {
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId.toString(),
        blogName: post.blogName,
        createdAt: post.createdAt.toISOString(),
        extendedLikesInfo
      }
    })
    if (dto.userId) {
      const postIds = posts.map(postDoc => postDoc._id);
      const likes = await PostLikeModel.find(
        {
          "userInfo.userId": dto.userId,
          postId: { $in: postIds }
        }
      )
      postsView.forEach(post => {
        const like = likes.find((like) => like.postId.toString() === post.id)
        if (like) {
          post.extendedLikesInfo.myStatus = like.status;
        }
      })
    }
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: postsView,
    }
  }

  async findPostById(postId: ObjectId, userId?: ObjectId): Promise<IPostView> {
    const post = await PostModel.findOne({ _id: postId })
    if (!post) {
      throw new CustomError('Post not found', HttpStatuses.NotFound)
    }
    let myStatus = PostLikeStatus.NONE;
    if (userId) {
      const like = await PostLikeModel.findOne({
        "userInfo.userId": userId,
        postId
      })
      if (like) {
        myStatus = like.status
      }
    }
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus,
        newestLikes: post.newestLikes
      }
    }
  }

}
