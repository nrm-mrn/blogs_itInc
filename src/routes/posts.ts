import { Request, Response, Router } from "express";
import { db } from "../db/db";
import { authMiddleware } from "../middlewares/auth.middleware";
import { inputValidationResultMiddleware } from "../middlewares/validationResult.middleware";
import { PostInputModel, PostViewModel } from "../db/db-types";
import { postsRepository } from "../repositories/posts.repository";
import { postInputValidator } from "./posts.validators";


export const postsRouter = Router({})

postsRouter.get('/', (req: Request, res: Response) => {
  const posts = db.posts;
  res.status(200).send(posts)
  return;
})

postsRouter.post('/',
  authMiddleware,
  postInputValidator,
  inputValidationResultMiddleware,
  async (req: Request<any, any, PostInputModel>, res: Response<PostViewModel>) => {
    const { post, error } = await postsRepository.createPost(req.body);
    if (error !== null) {
      res.sendStatus(400)
      return
    }
    res.status(201).send(post!)
    return;
  })

postsRouter.get('/:id', async (req: Request<{ 'id': string }>, res: Response<PostViewModel>) => {
  const post = await postsRepository.findPostById(req.params.id);
  if (!post) {
    res.sendStatus(404);
    return;
  }
  res.status(200).send(post)
  return;
})

postsRouter.put('/:id',
  authMiddleware,
  postInputValidator,
  inputValidationResultMiddleware,
  async (req: Request<{ 'id': string }, any, PostInputModel>, res: Response) => {
    const result = await postsRepository.editPost(req.params.id, req.body)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

postsRouter.delete('/:id',
  authMiddleware,
  async (req: Request<{ 'id': string }>, res: Response) => {
    const result = await postsRepository.deletePost(req.params.id)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

