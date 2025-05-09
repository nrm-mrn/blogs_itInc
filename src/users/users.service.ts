import { ObjectId, WithId } from "mongodb";
import { UsersRepository } from "./users.repository";
import { APIErrorResult, CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { ConfirmPasswordDto, IUserDb, UserInputModel } from "./user.types";
import { PasswordHashService } from "../auth/passHash.service";
import { EmailConfirmation, PasswordRecovery, User } from "./user.entity";
import { UUID } from "crypto";
import { DateTime } from "luxon";
import { inject, injectable } from "inversify";

@injectable()
export class UserService {

  constructor(
    @inject(UsersRepository)
    private readonly usersRepository: UsersRepository,
    @inject(PasswordHashService)
    private readonly passHashService: PasswordHashService,
  ) { }

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

    const hash = await this.passHashService.createHash(input.password);
    const newUser = new User(
      input.login,
      input.email,
      hash
    )
    const userId = await this.usersRepository.createUser(newUser)

    return { userId }
  }

  async getUserById(id: ObjectId): Promise<WithId<IUserDb> | null> {
    return this.usersRepository.getUserById(id);
  }

  async getUserByLoginOrEmail(input: string): Promise<WithId<IUserDb>> {
    const user = await this.usersRepository.getUserByLoginOrEmail(input);
    if (!user) {
      throw new CustomError('User not found', HttpStatuses.NotFound)
    }
    return user
  }

  async isLoginUnique(login: string): Promise<boolean> {
    const loginRes = await this.usersRepository.getUserByLoginOrEmail(login)
    if (loginRes) {
      return false
    }
    return true
  }

  async isEmailUnique(email: string): Promise<boolean> {
    const emailRes = await this.usersRepository.getUserByLoginOrEmail(email)
    if (emailRes) {
      return false
    }
    return true
  }

  async deleteUser(id: ObjectId): Promise<void> {
    return this.usersRepository.deleteUser(id)
  }

  async updateEmailConfirmation(email: string): Promise<EmailConfirmation> {
    const user = await this.usersRepository.getUserByEmail(email);
    if (!user) {
      throw new CustomError('User with provided email does not exist', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'user with given email does not exist' }] })
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new CustomError('Email is already confirmed', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'email is already confirmed' }] })
    }
    const newConfirmation = User.genEmailConfirmtion();
    await this.usersRepository.updateEmailConfirmation(email, newConfirmation);
    return newConfirmation
  }

  async confirmEmail(code: UUID): Promise<void> {
    const user = await this.usersRepository.getUserByEmailConfirmation(code)
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

    await this.usersRepository.confirmEmail(user._id);
  }

  async setPasswordRecovery(email: string): Promise<PasswordRecovery | null> {
    const user = await this.usersRepository.getUserByEmail(email);
    if (!user) {
      return null;
    }
    const recoveryObj = User.genPasswordRecovery();
    await this.usersRepository.recoverPassword(email, recoveryObj);
    return recoveryObj;
  }

  async confirmPassword(input: ConfirmPasswordDto): Promise<void> {
    const user = await this.usersRepository.getUserByPassRecovery(input.code);
    if (!user) {
      const errObj: APIErrorResult = {
        errorsMessages: [{ field: 'code', message: 'incorrect code' }],
      }
      throw new CustomError('incorrect recovery code', HttpStatuses.BadRequest, errObj)
    }
    const expired = user.passwordRecovery.expirationDate < DateTime.now();
    if (expired) {
      const errObj: APIErrorResult = {
        errorsMessages: [{ field: 'recoveryCode', message: 'code is expired' }]
      }
      throw new CustomError('code has been expired', HttpStatuses.BadRequest, errObj)
    }
    const hash = await this.passHashService.createHash(input.password);

    await this.usersRepository.updatePassword(user._id, hash);
    await this.usersRepository.cleanPassRecovery(user._id);
    return
  }
}
