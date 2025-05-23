import { ObjectId } from "../shared/types/objectId.type";
import { GetBlogsDto, GetBlogPostsDto, IBlogView } from "./blogs.types";
import { PagedResponse } from "../shared/types/pagination.types";
import { injectable } from "inversify";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { BlogModel } from "./blog.entity";
import { IPostView } from "../posts/api/posts.api.models";
import { PostModel } from "../posts/domain/post.entity";
import { PostLikeStatus } from "../posts/application/posts.dto";
import { PostLikeModel } from "../posts/domain/postLike.entity";

@injectable()
export class BlogQueryRepository {

  getFilter(dto: GetBlogsDto | GetBlogPostsDto) {
    let byId;
    let search;
    if ("blogId" in dto) {
      byId = { blogId: dto.blogId! }
    }
    if ("searchNameTerm" in dto && dto.searchNameTerm !== null) {
      search = { name: { $regex: dto.searchNameTerm!, $options: 'i' } }
    }
    return { ...byId, ...search }
  }

  async getAllBlogs(dto: GetBlogsDto): Promise<PagedResponse<IBlogView>> {
    const filter = this.getFilter(dto)
    const paging = dto.pagination
    const blogs = await BlogModel
      .find(filter)
      .sort({ [paging.sortBy]: paging.sortDirection })
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .exec()
    const total = await BlogModel.countDocuments(filter).exec()
    const blogViews: IBlogView[] = blogs.map(blog => {
      return {
        id: blog._id.toString(),
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        createdAt: blog.createdAt.toISOString(),
        isMembership: blog.isMembership
      }
    })

    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: blogViews
    }
  }

  async getBlogPosts(dto: GetBlogPostsDto): Promise<PagedResponse<IPostView>> {
    const filter = this.getFilter(dto);
    const paging = dto.pagination
    const posts = await PostModel
      .find(filter)
      .sort({ [paging.sortBy]: paging.sortDirection })
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .exec()
    const total = await PostModel.countDocuments(filter);
    const postViews: IPostView[] = posts.map(post => {
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
          myStatus: PostLikeStatus.NONE,
          newestLikes: post.newestLikes,
        }
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
      postViews.forEach(post => {
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
      items: postViews,
    }
  }

  async findBlog(id: ObjectId): Promise<IBlogView> {
    const blog = await BlogModel.findOne({ _id: id })
    if (!blog) {
      throw new CustomError('Blog does not exist', HttpStatuses.NotFound)
    }
    return {
      id: blog._id.toString(),
      description: blog.description,
      name: blog.name,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership
    }
  }
}
