import 'reflect-metadata'
import { Container } from "inversify";
import { BlogQueryRepository } from './blogs/blogsQuery.repository';
import { BlogRepository } from './blogs/blogs.repository';
import { BlogService } from './blogs/blogs.service';
import { BlogsController } from './blogs/api/blogs';
import { PostsRepository } from './posts/posts.repository';
import { CommentsRepository } from './comments/comments.repository';
import { PostsController } from './posts/api/posts';
import { PostsService } from './posts/posts.service';
import { PostsQueryRepository } from './posts/postsQuery.repository';
import { CommentsController } from './comments/api/comments';
import { CommentsService } from './comments/comments.service';
import { CommentsQueryRepository } from './comments/commentsQuery.repository';
import { UsersController } from './users/api/users';
import { UsersRepository } from './users/users.repository';
import { UsersQueryRepository } from './users/usersQuery.repository';
import { UserService } from './users/users.service';
import { PasswordHashService } from './auth/passHash.service';
import { MailerService } from './auth/email.service';
import { JwtService } from './auth/jwt.service';
import { AuthController } from './auth/api/auth';
import { AuthService } from './auth/auth.service';
import { SecurityController } from './security/api/security';
import { SessionsService } from './security/sessions.service';
import { SessionsRepository } from './security/sessions.repository';
import { SessionsQueryRepository } from './security/sessions.queryRepository';
import { ApiRequestsRepository } from './security/apiRequest.repository';
import { ApiRequestService } from './security/apiRequest.service';

export const container = new Container();

container.bind(BlogQueryRepository).toSelf();
container.bind(BlogRepository).toSelf();
container.bind(BlogService).toSelf();
container.bind(BlogsController).toSelf();

container.bind(PostsRepository).toSelf();
container.bind(PostsController).toSelf();
container.bind(PostsService).toSelf();
container.bind(PostsQueryRepository).toSelf();

container.bind(CommentsController).toSelf();
container.bind(CommentsRepository).toSelf();
container.bind(CommentsService).toSelf();
container.bind(CommentsQueryRepository).toSelf();

container.bind(UsersController).toSelf();
container.bind(UserService).toSelf();
container.bind(UsersRepository).toSelf();
container.bind(UsersQueryRepository).toSelf();

container.bind(AuthController).toSelf();
container.bind(AuthService).toSelf();
container.bind(PasswordHashService).toSelf();
container.bind(MailerService).toSelf();
container.bind(JwtService).toSelf();

container.bind(SecurityController).toSelf();
container.bind(SessionsService).toSelf();
container.bind(SessionsRepository).toSelf();
container.bind(SessionsQueryRepository).toSelf();

container.bind(ApiRequestsRepository).toSelf();
container.bind(ApiRequestService).toSelf();

