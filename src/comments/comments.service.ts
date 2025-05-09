import { ObjectId } from "mongodb";
import { CommentsRepository } from "./comments.repository";
import { ICommentView, CreateCommentDto, DeleteCommentDto, UpdateCommentDto } from "./comments.types";
import { CommentsQueryRepository } from "./commentsQuery.repository";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { PostsQueryRepository } from "../posts/postsQuery.repository";
import { UserService } from "../users/users.service";
import { inject, injectable } from "inversify";
import { Comment, CommentatorInfo } from "./comment.entity";

@injectable()
export class CommentsService {
  constructor(
    @inject(CommentsRepository)
    private readonly commentsRepository: CommentsRepository,
    @inject(PostsQueryRepository)
    private readonly postsQueryRepo: PostsQueryRepository,
    @inject(CommentsQueryRepository)
    private readonly commentsQueryRepo: CommentsQueryRepository,
    @inject(UserService)
    private readonly userService: UserService
  ) { };

  //TODO: change to return created id
  async createComment(dto: CreateCommentDto): Promise<{ data: ICommentView }> {
    const targetPost = await this.postsQueryRepo.findPostById(dto.postId);
    if (!targetPost) {
      throw new CustomError('Post with provided id does not exist', HttpStatuses.NotFound)
    }
    const userId = new ObjectId(dto.userId)
    const user = await this.userService.getUserById(userId)
    if (!user) {
      throw new Error('Failed to create a comment: user not found')
    }
    const commentatorInfo: CommentatorInfo = { userId: dto.userId, userLogin: user.login }
    const input = new Comment(
      dto.postId,
      dto.content,
      commentatorInfo,
    )
    const { commentId } = await this.commentsRepository.createComment(input);
    const data = await this.commentsQueryRepo.getCommentById(commentId)
    return { data }
  }

  async updateComment(dto: UpdateCommentDto): Promise<void> {
    const data = await this.commentsQueryRepo.getCommentById(dto.id);
    if (data.commentatorInfo.userId !== dto.userId) {
      throw new CustomError('Only comment creator can edit it', HttpStatuses.Forbidden)
    }
    return this.commentsRepository.editComment(dto);
  }

  async deleteComment(dto: DeleteCommentDto): Promise<void> {
    const data = await this.commentsQueryRepo.getCommentById(dto.id);
    if (data.commentatorInfo.userId !== dto.userId) {
      throw new CustomError('Only comment creator can delete it', HttpStatuses.Forbidden)
    }
    return this.commentsRepository.deleteComment(dto.id);
  }
}
