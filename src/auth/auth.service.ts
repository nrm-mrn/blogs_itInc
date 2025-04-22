import { usersRepository } from "../users/users.repository"
import { AuthSuccess, LoginDto, MeView } from "./auth.types";
import { ObjectId, WithId } from "mongodb";
import { usersQueryRepository } from "../users/usersQuery.repository";
import { APIErrorResult, CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { jwtService } from "./jwt.service";
import { passwordHashService } from "./passHash.service";
import { IUserDb, UserInputModel } from "../users/user.types";
import { User } from "../users/user.entity";
import { nodemailerService } from "./email.service";
import { emailTemplates } from "./email.templates";
import { SETTINGS } from "../settings/settings";
import { DateTime } from 'luxon'
import { RefreshToken } from "./refreshToken.entity";
import { rTokensRepository } from "./auth.repository";

export const authService = {

  async checkCredentials(credentials: LoginDto): Promise<AuthSuccess> {
    let user: WithId<IUserDb>;
    let isValidPass: boolean;
    try {
      user = await usersRepository.getUserByLoginOrEmail(credentials.loginOrEmail);
      isValidPass = await passwordHashService.compareHash(credentials.password, user.passwordHash);
      if (!isValidPass) {
        throw new CustomError('Wrong login or password', HttpStatuses.Unauthorized)
      }
    } catch (err) {
      if (err instanceof CustomError) {
        throw new CustomError('Wrong login or password', HttpStatuses.Unauthorized)
      } else {
        throw new Error(`Could not check user credentials: ${err}`)
      }
    }
    const accessToken = jwtService.createAccessToken(user._id.toString())
    const refreshToken = new RefreshToken(user._id.toString())
    await rTokensRepository.saveRefreshToken(refreshToken)
    return { accessToken, refreshToken: refreshToken.token }
  },


  async getUserInfo(id: ObjectId): Promise<{ data: MeView }> {
    const user = await usersQueryRepository.getUserById(id);
    if (!user) {
      throw new Error('User id not found')
    }
    return { data: { email: user.email, login: user.login, userId: user.id.toString() } }
  },

  async registerUser(newUserDto: UserInputModel): Promise<ObjectId> {
    const emailExists = await usersQueryRepository.getUserByEmail(newUserDto.email)
    const loginExists = await usersQueryRepository.getUserByLogin(newUserDto.login)
    if (emailExists) {
      const errObj: APIErrorResult = {
        errorsMessages: [
          { field: 'email', message: 'already exists' }
        ]
      }
      throw new CustomError('email already exists', HttpStatuses.BadRequest, errObj)
    }

    if (loginExists) {
      const errObj: APIErrorResult = {
        errorsMessages: [
          { field: 'login', message: 'already exists' }
        ]
      }
      throw new CustomError('login already exists', HttpStatuses.BadRequest, errObj)
    }

    const hash = await passwordHashService.createHash(newUserDto.password);
    const user = new User(newUserDto.login, newUserDto.email, hash)
    const email = emailTemplates.registrationEmail(user.emailConfirmation.confirmationCode)

    const userId = await usersRepository.createUser(user);

    await nodemailerService.sendEmail(
      user.email,
      email,
    ).catch(err => console.error(`error sending email: ${err}`))

    return userId
  },

  async confirmEmail(code: string): Promise<void> {
    const isUuid = new RegExp(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    ).test(code);
    if (!isUuid) {
      throw new CustomError('provided code is not a valid uuid', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'invalid UUID' }] })
    }
    const user = await usersQueryRepository.getUserByEmailConfirmation(code);

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

    await usersRepository.confirmEmail(user.email)

    return;
  },

  async resendConfirmation(email: string): Promise<void> {
    const user = await usersQueryRepository.getUserDbModelByEmail(email);
    if (!user) {
      throw new CustomError('User with provided email does not exist', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'user with given email does not exist' }] })
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new CustomError('Email is already confirmed', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'email', message: 'email is already confirmed' }] })
    }
    const newConfirmation = {
      expirationDate: DateTime.now().plus(SETTINGS.EMAIL_EXPIRATION),
      confirmationCode: User.genConfirmationCode(),
      isConfirmed: false,
    }
    const emailTemplate = emailTemplates.registrationEmail(newConfirmation.confirmationCode)

    await usersRepository.updateEmailConfirmation(email, newConfirmation);

    await nodemailerService.sendEmail(
      email,
      emailTemplate,
    ).catch(err => console.error(`error sending email: ${err}`))
    return
  },

  async reissueTokensPair(token: string): Promise<AuthSuccess> {
    //NOTE: should always work since guard check passed
    const payload = jwtService.decodeToken(token) as { userId: string, jti: string }

    const tokenDbEntry = await rTokensRepository.getRefreshToken(token);
    if (!tokenDbEntry) {
      throw new CustomError('Refresh token does not exist or already revoked', HttpStatuses.Unauthorized)
    }
    if (DateTime.fromJSDate(tokenDbEntry.expiration) < DateTime.utc()) {
      await rTokensRepository.deleteRefreshToken(token)
      throw new CustomError('Refresh token expired', HttpStatuses.Unauthorized)
    }

    const newRToken = new RefreshToken(payload.userId);
    const accessToken = jwtService.createAccessToken(payload.userId)
    const pr1 = rTokensRepository.deleteRefreshToken(token);
    const pr2 = rTokensRepository.saveRefreshToken(newRToken)
    await Promise.all([pr1, pr2])
    return { accessToken, refreshToken: newRToken.token }
  },

  async revokeRefreshToken(token: string): Promise<void> {
    const tokenDbEntry = await rTokensRepository.getRefreshToken(token);
    if (!tokenDbEntry) {
      throw new CustomError('Refresh token does not exist or already revoked', HttpStatuses.Unauthorized)
    }
    if (DateTime.fromJSDate(tokenDbEntry.expiration) < DateTime.utc()) {
      await rTokensRepository.deleteRefreshToken(token)
      throw new CustomError('Refresh token expired', HttpStatuses.Unauthorized)
    }
    return await rTokensRepository.deleteRefreshToken(token);
  }
}
