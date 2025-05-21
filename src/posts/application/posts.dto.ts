import { ObjectId } from "../../shared/types/objectId.type";

export interface CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
}

export interface EditPostByBlog {
  id: ObjectId;
  blogName: string;
}

export enum PostLikeStatus {
  LIKE = 'Like',
  DISLIKE = 'Dislike',
  NONE = 'None'
}

export interface CreatePostLikeDto {
  userId: ObjectId,
  postId: ObjectId,
  status: PostLikeStatus,
}
