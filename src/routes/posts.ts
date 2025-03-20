import { Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { inputValidationResultMiddleware } from "../middlewares/validationResult.middleware";
import { PostInputModel, PostViewModel } from "../db/db-types";
import { postGetValidator, postInputValidator, postUpdateValidator } from "./posts.validators";
import { param } from "express-validator";
import { ObjectId } from "mongodb";
import { postsQueryRepository } from "../repositories/postsQuery.repository";
import { PagedResponse, PagingParams } from "../shared/types";
import { querySanitizerChain } from "./shared.validators";
import { postsService } from "../domain/posts.service";


export const postsRouter = Router({})

postsRouter.get('/',
  querySanitizerChain,
  async (req: Request<any, any, any, PagingParams>, res: Response<PagedResponse<PostViewModel>>) => {
    const paging = req.query
    const postsView = await postsQueryRepository.getAllPosts({ pagination: paging })
    res.status(200).send(postsView)
    return;
  })

postsRouter.post('/',
  authMiddleware,
  postInputValidator,
  inputValidationResultMiddleware,
  async (req: Request<any, any, PostInputModel>, res: Response<PostViewModel>) => {
    const { post, error } = await postsService.createPost(req.body);
    if (!post) {
      res.sendStatus(400)
      return
    }
    res.status(201).send(post)
    return;
  })

postsRouter.get('/:id',
  postGetValidator,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }>, res: Response<PostViewModel>) => {
    const id = req.params.id as unknown as ObjectId
    const post = await postsQueryRepository.findPostById(id);
    if (!post) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(post)
    return;
  })

postsRouter.put('/:id',
  authMiddleware,
  postUpdateValidator,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }, any, PostInputModel>, res: Response) => {
    const id = req.params.id as unknown as ObjectId;
    const { error } = await postsService.editPost(id, req.body)
    if (error) {
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
    const { error } = await postsService.deletePost(id)
    if (error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

