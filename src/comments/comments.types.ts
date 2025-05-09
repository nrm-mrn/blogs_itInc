import { ObjectId } from "mongodb";
import { PagingFilter } from "../shared/types/pagination.types";
import { Comment, CommentatorInfo } from "./comment.entity";

export type CommentInputModel = {
  content: string;
}

export interface ICommentView {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
}

export interface ICommentDb extends Comment { }

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
