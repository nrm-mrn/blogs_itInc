import { Response, Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { inputValidationResultMiddleware } from "../../middlewares/validationResult.middleware";
import { PostInputModel, PostViewModel } from "../../db/db-types";
import { ObjectId } from "mongodb";
import { postsQueryRepository } from "../postsQuery.repository";
import { PagedResponse, PagingFilter, PagingQuery } from "../../shared/types/pagination.types";
import { postsService } from "../posts.service";
import { idToObjectId, querySanitizerChain } from "../../shared/middlewares/shared.sanitizers";
import { RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithQuery } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";
import { postInputValidator, postGetValidator, postUpdateValidator } from "./middleware/posts.validators";


export const postsRouter = Router({})

postsRouter.get('/',
  querySanitizerChain,
  async (req: RequestWithQuery<PagingQuery>, res: Response<PagedResponse<PostViewModel>>) => {
    const paging = req.query as PagingFilter;
    const postsView = await postsQueryRepository.getAllPosts({ pagination: paging })
    res.status(200).send(postsView)
    return;
  })

postsRouter.post('/',
  authMiddleware,
  postInputValidator,
  inputValidationResultMiddleware,
  async (req: RequestWithBody<PostInputModel>, res: Response<PostViewModel>) => {
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
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response<PostViewModel>) => {
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
  idToObjectId,
  async (req: RequestWithParamsAndBody<IdType, PostInputModel>, res: Response) => {
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
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response) => {
    const id = req.params.id as unknown as ObjectId;
    const { error } = await postsService.deletePost(id)
    if (error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

