import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";

export type GetPostsQuery = {} & PagingQuery

export type GetPostsDto = {
  pagination: PagingFilter;
}

export type GetPostCommentsQuery = {
  postId: string;
} & PagingQuery

export type GetPostCommentsSanitizedQuery = {
} & PagingFilter

export type PostViewModel = {
  id: ObjectId;
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
  blogName: string;
  createdAt: string;
}

export type PostDbModel = {
  _id: ObjectId;
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
  blogName: string;
  createdAt: string;
}

export type PostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
}

export type BlogPostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
}
