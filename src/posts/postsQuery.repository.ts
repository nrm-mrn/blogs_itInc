import { ObjectId } from "../shared/types/objectId.type";
import { PagedResponse } from "../shared/types/pagination.types";
import { GetPostsDto, IPostView } from "./posts.types";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { PostModel } from "./post.entity";

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
    const postsView = posts.map(post => {
      return {
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId.toString(),
        blogName: post.blogName,
        createdAt: post.createdAt.toISOString(),
      }
    })
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: postsView,
    }
  }

  async findPostById(id: ObjectId): Promise<IPostView> {
    const post = await PostModel.findOne({ _id: id })
    if (!post) {
      throw new CustomError('Post not found', HttpStatuses.NotFound)
    }
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
    }
  }

}
