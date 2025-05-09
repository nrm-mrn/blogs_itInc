import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";
import { Blog } from "./blog.entity";

export type GetBlogsDto = {
  searchNameTerm: string | null;
  pagination: PagingFilter;
}

export type GetBlogsQuery = {
  searchNameTerm?: string;
} & PagingQuery;

export type GetBlogPostsDto = {
  blogId: ObjectId;
  pagination: PagingFilter;
}

export type GetBlogsSanitizedQuery = {
  searchNameTerm: string | null;
} & PagingFilter;

export interface IBlogView {
  id: ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export interface IBlogDb extends Blog { };

export type BlogInputModel = {
  name: string;
  description: string;
  websiteUrl: string;
}
