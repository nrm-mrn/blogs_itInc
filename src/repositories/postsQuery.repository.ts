import { ObjectId } from "mongodb";
import { PostDbModel, PostViewModel } from "../db/db-types";
import { postsCollection } from "../db/mongoDb";
import { GetPostsDto, PagedResponse } from "../shared/types";

export const postsQueryRepository = {

  async getAllPosts(dto: GetPostsDto): Promise<PagedResponse<PostViewModel>> {
    const paging = dto.pagination
    const posts = await postsCollection
      .find({})
      .sort(paging.sortBy, paging.sortDirection)
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .toArray()
    const total = await postsCollection.countDocuments();
    const postsView = posts.map(post => {
      const { _id, ...rest } = post
      return { id: _id, ...rest }
    })
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: postsView,
    }
  },

  async findPostById(id: ObjectId): Promise<PostViewModel | null> {
    const post = await postsCollection.findOne({ _id: id })
    if (!post) {
      return null
    }
    const { _id, ...rest } = post
    return { id: _id, ...rest }
  },

}
