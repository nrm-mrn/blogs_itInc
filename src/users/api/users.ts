import { NextFunction, Response } from "express";
import { ObjectId } from "mongodb";
import { UsersQueryRepository } from "../usersQuery.repository";
import { UserService } from "../users.service";
import { APIErrorResult } from "../../shared/types/error.types";
import { PagedResponse } from "../../shared/types/pagination.types";
import { GetUsersQuery, GetUsersDto, GetUsersSanitizedQuery, UserInputModel, IUserView } from "../user.types";
import { RequestWithBody, RequestWithParams, RequestWithQuery } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";
import { inject, injectable } from "inversify";

@injectable()
export class UsersController {

  constructor(
    @inject(UsersQueryRepository)
    private readonly usersQueryRepo: UsersQueryRepository,
    @inject(UserService)
    private readonly usersService: UserService,
  ) { }

  async getAllUsers(req: RequestWithQuery<GetUsersQuery>, res: Response<PagedResponse<IUserView>>, next: NextFunction) {
    const { searchLoginTerm, searchEmailTerm, ...rest } = req.query as GetUsersSanitizedQuery;
    const getUsersDto: GetUsersDto = {
      searchLoginTerm: searchLoginTerm,
      searchEmailTerm: searchEmailTerm,
      pagination: { ...rest }
    }
    try {
      const usersView = await this.usersQueryRepo.getAllUsers(getUsersDto)
      res.status(200).send(usersView)
      return;
    } catch (err) {
      next(err)
    }
  }

  async createUser(req: RequestWithBody<UserInputModel>, res: Response<IUserView | APIErrorResult>, next: NextFunction) {
    try {
      const { userId } = await this.usersService.createUser(req.body);
      const user = await this.usersQueryRepo.getUserById(userId);
      if (!user) {
        throw new Error('Could not find created user')
      }
      res.status(201).send(user)
      return;
    } catch (err) {
      next(err)
    }
  }

  async deleteUser(req: RequestWithParams<IdType>, res: Response, next: NextFunction) {
    const id = req.params.id as unknown as ObjectId;
    try {
      await this.usersService.deleteUser(id)
      res.sendStatus(204);
      return
    } catch (err) {
      next(err)
    }
  }
}

