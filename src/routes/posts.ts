import { Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { inputValidationResultMiddleware } from "../middlewares/validationResult.middleware";
import { PostInputModel, PostViewModel } from "../db/db-types";
import { postsRepository } from "../repositories/posts.repository";
import { postGetValidator, postInputValidator, postUpdateValidator } from "./posts.validators";
import { param } from "express-validator";
import { ObjectId } from "mongodb";


export const postsRouter = Router({})

postsRouter.get('/', async (req: Request, res: Response) => {
  const postsDb = await postsRepository.getAllPosts()
  const postsView: PostViewModel[] = postsDb.map(post => {
    const { _id, ...rest } = post
    return { id: _id, ...rest }
  })
  res.status(200).send(postsView)
  return;
})

postsRouter.post('/',
  authMiddleware,
  postInputValidator,
  inputValidationResultMiddleware,
  async (req: Request<any, any, PostInputModel>, res: Response<PostViewModel>) => {
    const { post: postDb, error } = await postsRepository.createPost(req.body);
    if (error !== null) {
      res.sendStatus(400)
      return
    }
    const { _id, ...rest } = postDb!
    const postView: PostViewModel = { id: _id, ...rest };
    res.status(201).send(postView)
    return;
  })

postsRouter.get('/:id',
  postGetValidator,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }>, res: Response<PostViewModel>) => {
    const id = req.params.id as unknown as ObjectId
    const postDb = await postsRepository.findPostById(id);
    if (!postDb) {
      res.sendStatus(404);
      return;
    }
    const { _id, ...rest } = postDb!
    const postView: PostViewModel = { id: _id, ...rest }
    res.status(200).send(postView)
    return;
  })

postsRouter.put('/:id',
  authMiddleware,
  postUpdateValidator,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }, any, PostInputModel>, res: Response) => {
    const id = req.params.id as unknown as ObjectId;
    const result = await postsRepository.editPost(id, req.body)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

postsRouter.delete('/:id',
  authMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }>, res: Response) => {
    const id = req.params.id as unknown as ObjectId;
    const result = await postsRepository.deletePost(id)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

