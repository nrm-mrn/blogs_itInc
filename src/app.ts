import express, { Request, Response } from 'express';
import cors from 'cors';
import { blogsCollection, createIndexes, postsCollection, requestsCollection, sessionsCollection, usersCollection } from './db/mongoDb';
import { SETTINGS } from './settings/settings';
import { errorHandler } from './shared/middlewares/errorHandler.middleware';
import cookieParser from 'cookie-parser';
import { blogsRouter } from './blogs/blogs.router';
import { postsRouter } from './posts/posts.router';
import { commentsRouter } from './comments/comments.router';
import { usersRouter } from './users/users.router';
import { securityRouter } from './security/security.router';
import { authRouter } from './auth/auth.router';


export function createApp() {
  const app = express()

  app.use(express.json());
  app.use(cors())
  app.use(cookieParser())

  app.use(SETTINGS.PATHS.BLOGS, blogsRouter);
  app.use(SETTINGS.PATHS.POSTS, postsRouter);
  app.use(SETTINGS.PATHS.USERS, usersRouter);
  app.use(SETTINGS.PATHS.AUTH, authRouter);
  app.use(SETTINGS.PATHS.COMMENTS, commentsRouter)
  app.use(SETTINGS.PATHS.SECURITY, securityRouter)

  app.set('trust proxy', true)

  app.delete('/testing/all-data', async (req: Request, res: Response) => {
    await postsCollection.drop();
    await blogsCollection.drop();
    await usersCollection.drop();
    await sessionsCollection.drop();
    await requestsCollection.drop();
    await createIndexes();
    res.sendStatus(204);
    return
  })

  app.get('/', (req: Request, res: Response) => {
    res.status(200).send({ ver: '1.0' })
    return
  })

  app.use(errorHandler)

  return app
}
