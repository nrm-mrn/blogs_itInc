import { ObjectId } from "mongodb";
import { usersQueryRepository } from "./usersQuery.repository";
import { usersRepository } from "./users.repository";
import { APIErrorResult, CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { UserInputModel, UserViewModel, UserDbModel } from "./users.types";
import { passwordHashService } from "../auth/passHash.service";

export const userService = {
  async createUser(input: UserInputModel): Promise<UserViewModel> {
    const uniqueLogin = await this.isLoginUnique(input.login)
    if (!uniqueLogin) {
      const error: APIErrorResult = {
        errorsMessages: [
          { field: 'login', message: 'Login already exists' }
        ]
      }
      throw new CustomError('Login already exists', HttpStatuses.BadRequest, error)
    }
    const uniqueEmail = await this.isEmailUnique(input.email)
    if (!uniqueEmail) {
      const error: APIErrorResult = {
        errorsMessages: [
          { field: 'email', message: 'Email already exists' }
        ]
      }
      throw new CustomError('Email already exists', HttpStatuses.BadRequest, error)
    }

    const datetime = new Date();
    const datetimeISO = datetime.toISOString();
    const hash = await passwordHashService.createHash(input.password);
    const newUser: UserDbModel = {
      createdAt: datetimeISO,
      passwordHash: hash,
      ...input
    }
    const userId = await usersRepository.createUser(newUser)

    return { id: userId, login: newUser.login, email: newUser.email, createdAt: newUser.createdAt }
  },

  async isLoginUnique(login: string): Promise<boolean> {
    const loginRes = await usersQueryRepository.getUserByLogin(login)
    if (loginRes) {
      return false
    }
    return true
  },

  async isEmailUnique(email: string): Promise<boolean> {
    const emailRes = await usersQueryRepository.getUserByEmail(email)
    if (emailRes) {
      return false
    }
    return true
  },

  async deleteUser(id: ObjectId): Promise<void> {
    return usersRepository.deleteUser(id)
  }
}
