import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";

export type GetPostsQuery = {} & PagingQuery

export type GetPostsDto = {
  pagination: PagingFilter;
}
