import { ObjectId } from "mongodb";
import { blogsCollection, postsCollection } from "../db/mongoDb";
import { GetBlogsDto, GetBlogPostsDto, BlogViewModel } from "./blogs.types";
import { PagedResponse } from "../shared/types/pagination.types";
import { PostViewModel } from "../posts/posts.types";

export const blogQueryRepository = {

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
  },

  async getAllBlogs(dto: GetBlogsDto): Promise<PagedResponse<BlogViewModel>> {
    const filter = this.getFilter(dto)
    const paging = dto.pagination
    const blogs = await blogsCollection
      .find(filter)
      .sort(paging.sortBy, paging.sortDirection)
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .toArray()
    const total = await blogsCollection.countDocuments(filter)
    const blogViews: BlogViewModel[] = blogs.map(blog => {
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
  },

  async getBlogPosts(dto: GetBlogPostsDto): Promise<{ data: PagedResponse<PostViewModel> | null, error: string | null }> {
    const blog = await this.findBlog(dto.blogId);
    if (!blog) {
      return { data: null, error: 'Blog does not exist' }
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
    const postViews: PostViewModel[] = posts.map(post => {
      const { _id, ...rest } = post
      return { id: _id, ...rest }
    })
    return {
      data: {
        pagesCount: Math.ceil(total / paging.pageSize),
        page: paging.pageNumber,
        pageSize: paging.pageSize,
        totalCount: total,
        items: postViews,
      }, error: null
    }
  },

  async findBlog(id: ObjectId): Promise<BlogViewModel | null> {
    const blog = await blogsCollection.findOne({ _id: id })
    if (!blog) {
      return null;
    }
    const { _id, ...rest } = blog;
    const blogView: BlogViewModel = { id: _id, ...rest };
    return blogView;
  },
}
