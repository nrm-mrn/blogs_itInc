import { ObjectId } from "../shared/types/objectId.type";
import { UsersRepository } from "./users.repository";
import { APIErrorResult, CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { ConfirmPasswordDto, UserInputModel } from "./user.types";
import { PasswordHashService } from "../auth/passHash.service";
import { EmailConfirmation, PasswordRecovery, User, UserDocument, UserModel } from "./user.entity";
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
    const userIns = new User(input.login, input.email, hash)
    const newUser = new UserModel({
      ...userIns
    })
    const userId = await this.usersRepository.save(newUser)

    return { userId }
  }

  async findUserById(id: ObjectId): Promise<UserDocument | null> {
    return this.usersRepository.findUserById(id);
  }

  async getUserByLoginOrEmail(input: string): Promise<UserDocument> {
    const user = await this.usersRepository.findUserByLoginOrEmail(input);
    if (!user) {
      throw new CustomError('User not found', HttpStatuses.NotFound)
    }
    return user
  }

  async isLoginUnique(login: string): Promise<boolean> {
    const loginRes = await this.usersRepository.findUserByLoginOrEmail(login)
    if (loginRes) {
      return false
    }
    return true
  }

  async isEmailUnique(email: string): Promise<boolean> {
    const emailRes = await this.usersRepository.findUserByLoginOrEmail(email)
    if (emailRes) {
      return false
    }
    return true
  }

  async deleteUser(id: ObjectId): Promise<void> {
    const user = await this.usersRepository.getUserById(id)
    await this.usersRepository.deleteUser(user)
    return
  }

  async updateEmailConfirmation(email: string): Promise<EmailConfirmation> {
    const user = await this.usersRepository.findUserByEmail(email);
    if (!user) {
      throw new CustomError('User with provided email does not exist', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'user with given email does not exist' }] })
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new CustomError('Email is already confirmed', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'email is already confirmed' }] })
    }
    const newConfirmation = User.genEmailConfirmtion();
    user.emailConfirmation = newConfirmation
    await this.usersRepository.save(user);
    return newConfirmation
  }

  async confirmEmail(code: UUID): Promise<void> {
    const user = await this.usersRepository.findUserByEmailConfirmation(code)
    if (!user) {
      throw new CustomError('User with provided code does not exist', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'user with provided code does not exist' }] })
    }

    if (user.emailConfirmation.isConfirmed) {
      throw new CustomError('Email has already been confirmed', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'email has already been confirmed' }] })
    }

    const expired = DateTime.fromJSDate(user.emailConfirmation.expirationDate) < DateTime.now()
    if (expired) {
      throw new CustomError('code has been expired', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'code has expired' }] })
    }
    user.emailConfirmation.isConfirmed = true;
    await this.usersRepository.save(user);
    return
  }

  async setPasswordRecovery(email: string): Promise<PasswordRecovery | null> {
    const user = await this.usersRepository.findUserByEmail(email);
    if (!user) {
      return null;
    }
    const recoveryObj = User.genPasswordRecovery();
    user.passwordRecovery = recoveryObj
    await this.usersRepository.save(user);
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
    const expired = DateTime.fromJSDate(user.passwordRecovery!.expirationDate) < DateTime.now();
    if (expired) {
      const errObj: APIErrorResult = {
        errorsMessages: [{ field: 'recoveryCode', message: 'code is expired' }]
      }
      throw new CustomError('code has been expired', HttpStatuses.BadRequest, errObj)
    }
    const hash = await this.passHashService.createHash(input.password);
    user.passwordHash = hash;
    user.passwordRecovery = null;
    await this.usersRepository.save(user);
    return
  }
}
