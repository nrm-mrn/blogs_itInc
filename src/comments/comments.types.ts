import { ObjectId } from "../shared/types/objectId.type";
import { PagingFilter } from "../shared/types/pagination.types";
import { Comment, CommentatorInfo } from "./comment.entity";
import { CommentLikeStatus } from "./commentLike.entity";

export type CommentInputModel = {
  content: string;
}

export interface ILikesInfoView {
  likesCount: number;
  dislikesCount: number;
  myStatus: CommentLikeStatus;
}

export interface ICommentView {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: ILikesInfoView;
}

export interface ICommentDb extends Comment { }

export type LikeInputDto = {
  userId: ObjectId,
  commentId: ObjectId,
  status: CommentLikeStatus
}

export type LikeInputModel = {
  likeStatus: CommentLikeStatus
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
  userId?: ObjectId;
}
