import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";

export type CommentInputModel = {
  content: string;
}

export type CommentatorInfo = {
  userId: string;
  userLogin: string;
}

export type CommentViewModel = {
  id: ObjectId;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
}

export type CommentDbModel = {
  postId: ObjectId;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
}

export type CreateCommentDto = {
  userId: string;
  postId: ObjectId;
} & CommentInputModel;

export type UpdateCommentDto = {
  id: ObjectId;
  userId: string;
} & CommentInputModel;

export type DeleteCommentDto = {
  id: ObjectId;
  userId: string;
}

export type GetCommentsDto = {
  postId: ObjectId;
  paginator: PagingFilter;
}
