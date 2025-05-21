import { ObjectId } from "../../shared/types/objectId.type";
import mongoose, { HydratedDocument, Model, Schema } from "mongoose"
import { SETTINGS } from "../../settings/settings";
import { CreatePostDto, CreatePostLikeDto, PostLikeStatus } from "../application/posts.dto";
import { BlogModel } from "../../blogs/blog.entity";
import { PostLikeDocument, PostLikeModel } from "./postLike.entity";

export class Post {
  createdAt: Date
  likesCount: number = 0
  dislikesCount: number = 0
  newestLikes: {
    addedAt: string;
    userId: string;
    login: string;
  }[] = [];
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: ObjectId,
    public blogName: string,
  ) {
    this.createdAt = new Date();
  }
}

const postStatic = {
  async createPost(dto: CreatePostDto): Promise<PostDocument> {
    const post = new PostModel() as PostDocument;
    //WARN: Ok to do cross-domain validation here?
    const blog = await BlogModel.findById(dto.blogId);
    if (!blog) {
      throw new Error('Blog should exist')
    }
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = blog.name;
    post.likesCount = 0;
    post.dislikesCount = 0;

    return post
  }
}

type PostStatics = typeof postStatic;
type PostMethods = typeof postMethods;
type PostModel = Model<Post, {}, PostMethods> & PostStatics;

const postMethods = {
  async handleLike(dto: CreatePostLikeDto): Promise<PostLikeDocument | null> {
    const postLike = await PostLikeModel.findOne({
      postId: dto.postId,
      "userInfo.userId": dto.userId
    })
    if (!postLike) {
      if (dto.status === PostLikeStatus.NONE) {
        return null
      }
      return (this as unknown as PostDocument)._createLike(dto);
    }
    if (postLike.status === dto.status) {
      return postLike;
    }
    return (this as unknown as PostDocument)._updateLikeStatus(dto, postLike);
  },

  async _createLike(dto: CreatePostLikeDto): Promise<PostLikeDocument> {
    switch (dto.status) {
      case PostLikeStatus.LIKE: {
        (this as unknown as PostDocument).likesCount += 1;
        break
      }
      case PostLikeStatus.DISLIKE: {
        (this as unknown as PostDocument).dislikesCount += 1;
        break
      }
    }
    const postLike = await PostLikeModel.createPostLike(dto);
    return postLike;
  },

  async _updateLikeStatus(dto: CreatePostLikeDto, like: PostLikeDocument): Promise<PostLikeDocument> {
    switch (dto.status) {
      case PostLikeStatus.LIKE: {
        (this as unknown as PostDocument).likesCount += 1;
        if (like.status === PostLikeStatus.DISLIKE) {
          (this as unknown as PostDocument).dislikesCount -= 1;
        }
        break;
      }
      case PostLikeStatus.DISLIKE: {
        (this as unknown as PostDocument).dislikesCount += 1;
        if (like.status === PostLikeStatus.LIKE) {
          (this as unknown as PostDocument).likesCount -= 1;
        }
        break;
      }
      case PostLikeStatus.NONE: {
        if (like.status === PostLikeStatus.LIKE) {
          (this as unknown as PostDocument).likesCount -= 1;
          break;
        }
        (this as unknown as PostDocument).dislikesCount -= 1;
        break;
      }
    }
    like.status = dto.status
    return like;
  },

  async updateNewestLikes(): Promise<void> {
    const recentLikesDocs: PostLikeDocument[] = await PostLikeModel
      .find({
        postId: (this as unknown as PostDocument)._id,
        status: PostLikeStatus.LIKE,
      })
      .sort({ updatedAt: 'desc' })
      .limit(3);
    (this as unknown as PostDocument).newestLikes = recentLikesDocs
      .map(likeDoc => {
        return {
          addedAt: likeDoc.updatedAt.toISOString(),
          userId: likeDoc.userInfo.userId.toString(),
          login: likeDoc.userInfo.login
        }
      })
  },

  async updatePost(dto: CreatePostDto) {
    (this as unknown as PostDocument).title = dto.title;
    (this as unknown as PostDocument).shortDescription = dto.shortDescription;
    (this as unknown as PostDocument).content = dto.content;
    (this as unknown as PostDocument).blogId = dto.blogId;
  }
}

export const NewestLikeSchema = new mongoose.Schema({
  addedAt: { type: String, required: true },
  userId: { type: String, required: true },
  login: { type: String, required: true },
},
  { _id: false }
)

export const PostSchema = new mongoose.Schema<Post>({
  title: { type: String, required: true },
  shortDescription: { type: String, required: true },
  content: { type: String, required: true },
  blogId: { type: Schema.Types.ObjectId, required: true },
  blogName: { type: String, required: true },
  likesCount: { type: Number, required: true },
  dislikesCount: { type: Number, required: true },
  newestLikes: [NewestLikeSchema],
},
  {
    timestamps: { createdAt: true, updatedAt: false },
    optimisticConcurrency: true
  },
)

PostSchema.statics = postStatic;
PostSchema.methods = postMethods;

export const PostModel = mongoose.model<Post, PostModel>(SETTINGS.PATHS.POSTS, PostSchema)

export type PostDocument = HydratedDocument<Post, PostMethods>;
