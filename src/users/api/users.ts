import { NextFunction, Response, Router } from "express";
import { baseAuthGuard } from "../../auth/guards/baseAuthGuard";
import { inputValidationResultMiddleware } from "../../shared/middlewares/validationResult.middleware";
import { ObjectId } from "mongodb";
import { usersQueryRepository } from "../usersQuery.repository";
import { userService } from "../users.service";
import { APIErrorResult } from "../../shared/types/error.types";
import { PagedResponse } from "../../shared/types/pagination.types";
import { GetUsersQuery, GetUsersDto, GetUsersSanitizedQuery, UserInputModel, IUserView } from "../user.types";
import { RequestWithBody, RequestWithParams, RequestWithQuery } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";
import { idToObjectId } from "../../shared/middlewares/shared.sanitizers";
import { usersQuerySanChain } from "./middleware/users.sanitizers";
import { userInputValidator } from "./middleware/users.validators";


export const usersRouter = Router({})

usersRouter.get('/',
  baseAuthGuard,
  usersQuerySanChain,
  async (req: RequestWithQuery<GetUsersQuery>, res: Response<PagedResponse<IUserView>>, next: NextFunction) => {
    const { searchLoginTerm, searchEmailTerm, ...rest } = req.query as GetUsersSanitizedQuery;
    const getUsersDto: GetUsersDto = {
      searchLoginTerm: searchLoginTerm,
      searchEmailTerm: searchEmailTerm,
      pagination: { ...rest }
    }
    try {
      const usersView = await usersQueryRepository.getAllUsers(getUsersDto)
      res.status(200).send(usersView)
      return;
    } catch (err) {
      next(err)
    }
  })

usersRouter.post('/',
  baseAuthGuard,
  userInputValidator,
  inputValidationResultMiddleware,
  async (req: RequestWithBody<UserInputModel>, res: Response<IUserView | APIErrorResult>, next: NextFunction) => {
    try {
      const { userId } = await userService.createUser(req.body);
      const user = await usersQueryRepository.getUserById(userId);
      if (!user) {
        throw new Error('Could not find created user')
      }
      res.status(201).send(user)
      return;
    } catch (err) {
      next(err)
    }
  })


usersRouter.delete('/:id',
  baseAuthGuard,
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response, next: NextFunction) => {
    const id = req.params.id as unknown as ObjectId;
    try {
      await userService.deleteUser(id)
      res.sendStatus(204);
      return
    } catch (err) {
      next(err)
    }
  })

