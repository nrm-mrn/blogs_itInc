import express, { Request, Response } from 'express';
import { blogsRouter } from './routes/blogs';
import { postsRouter } from './routes/posts';
import cors from 'cors';
import { blogsCollection, postsCollection } from './db/mongoDb';

export const app = express()

app.use(express.json());
app.use(cors())
app.use('/blogs', blogsRouter);
app.use('/posts', postsRouter);


app.delete('/testing/all-data', async (req: Request, res: Response) => {
  await postsCollection.drop();
  await blogsCollection.drop();
  res.sendStatus(204);
  return
})

app.get('/', (req: Request, res: Response) => {
  res.status(200).send({ ver: '1.0' })
  return
})
