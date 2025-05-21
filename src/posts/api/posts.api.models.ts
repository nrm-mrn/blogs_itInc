import { PostLikeStatus } from "../application/posts.dto";

export type PostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export type PostLikeInputModel = {
  likeStatus: PostLikeStatus;
}

export interface IPostView {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: IExtendedLikesInfo;
}

export interface IExtendedLikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: PostLikeStatus;
  newestLikes: INewestLike[]
}

export interface INewestLike {
  addedAt: string;
  userId: string;
  login: string;
}
