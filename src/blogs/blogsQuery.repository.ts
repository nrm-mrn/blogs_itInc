import { ObjectId } from "mongodb";
import { blogsCollection, postsCollection } from "../db/mongoDb";
import { GetBlogsDto, GetBlogPostsDto, IBlogView } from "./blogs.types";
import { PagedResponse } from "../shared/types/pagination.types";
import { IPostView } from "../posts/posts.types";
import { injectable } from "inversify";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";

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
    const blogs = await blogsCollection
      .find(filter)
      .sort(paging.sortBy, paging.sortDirection)
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .toArray()
    const total = await blogsCollection.countDocuments(filter)
    const blogViews: IBlogView[] = blogs.map(blog => {
      const { _id, ...rest } = blog;
      return { id: _id, ...rest }
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
    const blog = await this.findBlog(dto.blogId);
    if (!blog) {
      throw new CustomError('Blog does not exist', HttpStatuses.NotFound)
    }
    const filter = this.getFilter(dto);
    const paging = dto.pagination
    const posts = await postsCollection
      .find(filter)
      .sort(paging.sortBy, paging.sortDirection)
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .toArray()
    const total = await postsCollection.countDocuments(filter);
    const postViews: IPostView[] = posts.map(post => {
      const { _id, ...rest } = post
      return {
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId.toString(),
        blogName: post.blogName,
        createdAt: post.createdAt
      }
    })
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: postViews,
    }
  }

  async findBlog(id: ObjectId): Promise<IBlogView> {
    const blog = await blogsCollection.findOne({ _id: id })
    if (!blog) {
      throw new CustomError('Blog does not exist', HttpStatuses.NotFound)
    }
    return {
      id: blog._id,
      description: blog.description,
      name: blog.name,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership
    }
  }
}
