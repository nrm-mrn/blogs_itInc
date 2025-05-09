import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";
import { Post } from "./post.entity";

export type GetPostsQuery = {} & PagingQuery

export type GetPostsDto = {
  pagination: PagingFilter;
}

export type GetPostCommentsQuery = {
  postId: string;
} & PagingQuery

export type GetPostCommentsSanitizedQuery = {
} & PagingFilter

export interface IPostView {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
}

export interface IPostDb extends Post { }

export type PostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
}

export type PostUpdateDto = {
  title: string;
  shortDescription: string;
  content: string;
  blogName: string;
}

export type BlogPostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
}
