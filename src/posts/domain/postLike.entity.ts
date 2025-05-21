import { ObjectId } from "../../shared/types/objectId.type";
import mongoose, { HydratedDocument, Model, Schema } from "mongoose";
import { SETTINGS } from "../../settings/settings";
import { CreatePostLikeDto, PostLikeStatus } from "../application/posts.dto";
import { UserModel } from "../../users/user.entity";

export enum LikeStatus {
  LIKE = 'Like',
  DISLIKE = 'Dislike',
  NONE = 'None'
}

export class PostLike {
  userInfo: {
    userId: ObjectId,
    login: string,
  }
  createdAt: Date
  updatedAt: Date
  constructor(
    userId: ObjectId,
    login: string,
    public postId: ObjectId,
    public status: PostLikeStatus,
  ) {
    this.userInfo = {
      userId,
      login,
    }
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

type PostLikeStatics = typeof postLikeStatic
type PostLikeModel = Model<PostLike, {}, {}> & PostLikeStatics;

const postLikeStatic = {
  async createPostLike(dto: CreatePostLikeDto): Promise<PostLikeDocument> {
    const postLike = new PostLikeModel();
    //WARN: Ok to get user info here?
    const user = await UserModel.findById(dto.userId);
    if (!user) {
      throw new Error('User not found')
    }
    postLike.userInfo.userId = user._id;
    postLike.userInfo.login = user.login;
    postLike.postId = dto.postId;
    postLike.status = dto.status;
    return postLike;
  }
}


export const PostLikeSchema = new Schema<PostLike>({
  userInfo: {
    userId: { type: Schema.Types.ObjectId, required: true },
    login: { type: String, required: true }
  },
  postId: { type: Schema.Types.ObjectId, required: true },
  status: { type: String, enum: LikeStatus, required: true },
},
  {
    timestamps:
    {
      createdAt: true, updatedAt: true
    },
    optimisticConcurrency: true
  }
)

PostLikeSchema.statics = postLikeStatic;

export const PostLikeModel = mongoose.model<PostLike, PostLikeModel>(SETTINGS.PATHS.POSTS_LIKES, PostLikeSchema)

export type PostLikeDocument = HydratedDocument<PostLike>

