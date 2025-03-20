import { ObjectId } from "mongodb";
import { BlogViewModel, PostViewModel } from "../db/db-types";

export type FieldError = {
  message: string | null;
  field: string | null;
}

export type APIErrorResult = {
  errorsMessages: FieldError[] | null;
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
};

export type PagingParams = {
  sortDirection: SortDirection;
  sortBy: string;
  pageSize: number;
  pageNumber: number;
}

export type GetBlogsDto = {
  searchNameTerm: string | null;
  pagination: PagingParams;
}

export type GetBlogsQuery = {
  searchNameTerm: string;
  sortDirection: SortDirection;
  sortBy: string;
  pageSize: number;
  pageNumber: number;
}

export type GetPostsQuery = {
  sortDirection: SortDirection;
  sortBy: string;
  pageSize: number;
  pageNumber: number;
}

export type GetPostsDto = {
  pagination: PagingParams;
}

export type GetBlogPostsDto = {
  blogId: ObjectId;
  pagination: PagingParams;
}

export type PagedResponse<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}
