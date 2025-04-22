import express, { Request, Response } from 'express';
import { blogsRouter } from './blogs/api/blogs';
import { postsRouter } from './posts/api/posts';
import cors from 'cors';
import { blogsCollection, createIndexes, postsCollection, rTokensCollection, usersCollection } from './db/mongoDb';
import { usersRouter } from './users/api/users';
import { authRouter } from './auth/api/auth';
import { SETTINGS } from './settings/settings';
import { errorHandler } from './shared/middlewares/errorHandler.middleware';
import { commentsRouter } from './comments/api/comments';
import cookieParser from 'cookie-parser';

export const app = express()

app.use(express.json());
app.use(cors())
app.use(cookieParser())

app.use(SETTINGS.PATHS.BLOGS, blogsRouter);
app.use(SETTINGS.PATHS.POSTS, postsRouter);
app.use(SETTINGS.PATHS.USERS, usersRouter);
app.use(SETTINGS.PATHS.AUTH, authRouter);
app.use(SETTINGS.PATHS.COMMENTS, commentsRouter)

app.delete('/testing/all-data', async (req: Request, res: Response) => {
  await postsCollection.drop();
  await blogsCollection.drop();
  await usersCollection.drop()
  await rTokensCollection.drop()
  await createIndexes()
  res.sendStatus(204);
  return
})

app.get('/', (req: Request, res: Response) => {
  res.status(200).send({ ver: '1.0' })
  return
})

app.get('/testingError', (req: Request, res: Response) => {
  throw new Error('Test server error')
  return
})

app.use(errorHandler)
