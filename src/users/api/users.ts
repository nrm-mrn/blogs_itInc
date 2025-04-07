import { Response, Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { inputValidationResultMiddleware } from "../../middlewares/validationResult.middleware";
import { UserInputModel, UserViewModel } from "../../db/db-types";
import { ObjectId } from "mongodb";
import { usersQueryRepository } from "../usersQuery.repository";
import { userService } from "../users.service";
import { APIErrorResult } from "../../shared/types/error.types";
import { PagedResponse } from "../../shared/types/pagination.types";
import { GetUsersQuery, GetUsersDto, GetUsersSanitizedQuery } from "../users.types";
import { RequestWithBody, RequestWithParams, RequestWithQuery } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";
import { idToObjectId } from "../../shared/middlewares/shared.sanitizers";
import { usersQuerySanChain } from "./middleware/users.sanitizers";
import { userInputValidator } from "./middleware/users.validators";


export const usersRouter = Router({})

usersRouter.get('/',
  authMiddleware,
  usersQuerySanChain,
  async (req: RequestWithQuery<GetUsersQuery>, res: Response<PagedResponse<UserViewModel>>) => {
    const { searchLoginTerm, searchEmailTerm, ...rest } = req.query as GetUsersSanitizedQuery;
    const getUsersDto: GetUsersDto = {
      searchLoginTerm: searchLoginTerm,
      searchEmailTerm: searchEmailTerm,
      pagination: { ...rest }
    }
    const usersView = await usersQueryRepository.getAllUsers(getUsersDto)
    res.status(200).send(usersView)
    return;
  })

usersRouter.post('/',
  authMiddleware,
  userInputValidator,
  inputValidationResultMiddleware,
  async (req: RequestWithBody<UserInputModel>, res: Response<UserViewModel | APIErrorResult>) => {

    let user: UserViewModel;
    try {
      user = await userService.createUser(req.body);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message == 'Login should be unique') {
          const errorObj: APIErrorResult = {
            errorsMessages: [{ message: err.message, field: 'login' }]
          }
          res.status(400).send(errorObj)
        }
        if (err.message == 'Email should be unique') {
          const errorObj: APIErrorResult = {
            errorsMessages: [{ message: err.message, field: 'email' }]
          }
          res.status(400).send(errorObj)
        }
      } else {
        console.error('Unknown error', err)
        res.sendStatus(400)
      }
      return
    }
    res.status(201).send(user)
    return;
  })


usersRouter.delete('/:id',
  authMiddleware,
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response) => {
    const id = req.params.id as unknown as ObjectId;
    try {
      userService.deleteUser(id)
    }
    catch (error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
  })

