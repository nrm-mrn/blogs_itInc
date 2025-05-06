import { ObjectId, WithId } from "mongodb";
import { usersRepository } from "./users.repository";
import { APIErrorResult, CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { ConfirmPasswordDto, IUserDb, UserInputModel } from "./user.types";
import { passwordHashService } from "../auth/passHash.service";
import { EmailConfirmation, PasswordRecovery, User } from "./user.entity";
import { UUID } from "crypto";
import { DateTime } from "luxon";

export const userService = {
  async createUser(input: UserInputModel): Promise<{ userId: ObjectId }> {
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

    const hash = await passwordHashService.createHash(input.password);
    const newUser = new User(
      input.login,
      input.email,
      hash
    )
    const userId = await usersRepository.createUser(newUser)

    return { userId }
  },

  async getUserById(id: ObjectId): Promise<WithId<IUserDb> | null> {
    return usersRepository.getUserById(id);
  },

  async getUserByLoginOrEmail(input: string): Promise<WithId<IUserDb>> {
    const user = await usersRepository.getUserByLoginOrEmail(input);
    if (!user) {
      throw new CustomError('User not found', HttpStatuses.NotFound)
    }
    return user
  },

  async isLoginUnique(login: string): Promise<boolean> {
    const loginRes = await usersRepository.getUserByLoginOrEmail(login)
    if (loginRes) {
      return false
    }
    return true
  },

  async isEmailUnique(email: string): Promise<boolean> {
    const emailRes = await usersRepository.getUserByLoginOrEmail(email)
    if (emailRes) {
      return false
    }
    return true
  },

  async deleteUser(id: ObjectId): Promise<void> {
    return usersRepository.deleteUser(id)
  },

  async updateEmailConfirmation(email: string): Promise<EmailConfirmation> {
    const user = await usersRepository.getUserByEmail(email);
    if (!user) {
      throw new CustomError('User with provided email does not exist', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'user with given email does not exist' }] })
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new CustomError('Email is already confirmed', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'email is already confirmed' }] })
    }
    const newConfirmation = User.genEmailConfirmtion();
    await usersRepository.updateEmailConfirmation(email, newConfirmation);
    return newConfirmation
  },

  async confirmEmail(code: UUID): Promise<void> {
    const user = await usersRepository.getUserByEmailConfirmation(code)
    if (!user) {
      throw new CustomError('User with provided code does not exist', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'user with provided code does not exist' }] })
    }

    if (user.emailConfirmation.isConfirmed) {
      throw new CustomError('Email has already been confirmed', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'email has already been confirmed' }] })
    }

    const expired = user.emailConfirmation.expirationDate < DateTime.now()
    if (expired) {
      throw new CustomError('code has been expired', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'code has expired' }] })
    }

    await usersRepository.confirmEmail(user._id);
  },

  async setPasswordRecovery(email: string): Promise<PasswordRecovery | null> {
    const user = await usersRepository.getUserByEmail(email);
    if (!user) {
      return null;
    }
    const recoveryObj = User.genPasswordRecovery();
    await usersRepository.recoverPassword(email, recoveryObj);
    return recoveryObj;
  },

  async confirmPassword(input: ConfirmPasswordDto): Promise<void> {
    const user = await usersRepository.getUserByPassRecovery(input.code);
    if (!user) {
      const errObj: APIErrorResult = {
        errorsMessages: [{ field: 'code', message: 'incorrect code' }],
      }
      throw new CustomError('incorrect recovery code', HttpStatuses.BadRequest, errObj)
    }
    const expired = user.passwordRecovery.expirationDate < DateTime.now();
    if (expired) {
      const errObj: APIErrorResult = {
        errorsMessages: [{ field: 'code', message: 'code is expired' }]
      }
      throw new CustomError('code has been expired', HttpStatuses.BadRequest, errObj)
    }
    const hash = await passwordHashService.createHash(input.password);

    await usersRepository.updatePassword(user._id, hash);
    await usersRepository.cleanPassRecovery(user._id);
    return
  }


}
