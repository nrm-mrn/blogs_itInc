import express, { Request, Response } from 'express'
import { blogsRouter } from './routes/blogs';
import { postsRouter } from './routes/posts';
import { setDb } from './db/db';
import cors from 'cors'

export const app = express()

app.use(express.json());
app.use(cors())
app.use('/blogs', blogsRouter);
app.use('/posts', postsRouter);

setDb();

app.delete('/testing/all-data', async (req: Request, res: Response) => {
  setDb();
  res.sendStatus(204);
  return
})

app.get('/', (req: Request, res: Response) => {
  res.status(200).send({ ver: '1.0' })
  return
})
