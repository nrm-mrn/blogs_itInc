import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";

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

export type BlogViewModel = {
  id: ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export type BlogDbModel = {
  _id: ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export type BlogInputModel = {
  name: string;
  description: string;
  websiteUrl: string;
}
