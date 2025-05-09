import { ObjectId } from "mongodb";

export class Comment {
  createdAt: string
  constructor(
    public postId: ObjectId,
    public content: string,
    public commentatorInfo: CommentatorInfo,
  ) {
    this.createdAt = new Date().toISOString();
  }
}

export interface CommentatorInfo {
  userId: string;
  userLogin: string;
}
