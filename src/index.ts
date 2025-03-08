import express, { Request, Response } from 'express'
import { blogsRouter } from './routes/blogs';
import { postsRouter } from './routes/posts';
import { setDb } from './db/db';

export const app = express()

app.use(express.json());
app.use('/blogs', blogsRouter);
app.use('/posts', postsRouter);

app.delete('/testing/all-data', async (req: Request, res: Response) => {
  await setDb();
  res.sendStatus(204);
})

app.get('/', async (req: Request, res: Response) => {
  res.status(200).send({ ver: '1.0' })
})
