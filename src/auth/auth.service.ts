import { AuthSuccess, CreateRefreshTokenDto, LoginDto, RTokenPayload } from "./auth.types";
import { ObjectId, WithId } from "mongodb";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { jwtService } from "./jwt.service";
import { passwordHashService } from "./passHash.service";
import { ConfirmPasswordDto, IUserDb, UserInputModel } from "../users/user.types";
import { nodemailerService } from "./email.service";
import { emailTemplates } from "./email.templates";
import { sessionsService } from "../security/sessions.service";
import { CreateSessionDto } from "../security/session.types";
import { userService } from "../users/users.service";
import { UUID } from "crypto";

export const authService = {

  async checkCredentials(credentials: LoginDto): Promise<AuthSuccess> {
    let user: WithId<IUserDb>;
    let isValidPass: boolean;
    try {
      user = await userService.getUserByLoginOrEmail(credentials.loginOrEmail);
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
    const rtInput: CreateRefreshTokenDto = {
      userId: user._id.toString(),
      deviceId: new ObjectId().toString(),
    }
    const accessToken = jwtService.createAccessToken(user._id.toString())
    const { token: rToken, iat } = jwtService.createRefreshToken(rtInput)

    const sessionInput: CreateSessionDto = {
      deviceId: rtInput.deviceId,
      userId: rtInput.userId,
      iat,
      ip: credentials.ip,
      title: credentials.title,
    }
    await sessionsService.saveSession(sessionInput);

    return { accessToken, refreshToken: rToken }
  },

  async registerUser(newUserDto: UserInputModel): Promise<ObjectId> {
    const { userId } = await userService.createUser(newUserDto);

    const user = await userService.getUserById(userId);

    if (!user) {
      throw new Error('Failed to create a new user entry')
    }

    const email = emailTemplates.registrationEmail(user.emailConfirmation.confirmationCode)


    nodemailerService.sendEmail(
      user.email,
      email,
    ).catch(err => console.error(`error sending email: ${err}`))

    return userId
  },

  async confirmEmail(code: string): Promise<void> {
    this.validateUuid(code);
    const confirmationCode = code as UUID
    await userService.confirmEmail(confirmationCode);
    return;
  },

  async resendConfirmation(email: string): Promise<void> {
    const newConfirmation = await userService.updateEmailConfirmation(email)
    const emailTemplate = emailTemplates.registrationEmail(newConfirmation.confirmationCode)
    nodemailerService.sendEmail(
      email,
      emailTemplate,
    ).catch(err => console.error(`error sending email: ${err}`))
    return
  },

  async reissueTokensPair(token: string): Promise<AuthSuccess> {
    //NOTE: should always work since guard check passed
    const payload = jwtService.verifyRefreshToken(token) as unknown as RTokenPayload

    const session = await sessionsService.getSession(payload.deviceId, payload.iat);
    if (!session) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
    }

    const { token: newRToken, iat } = jwtService.createRefreshToken(
      {
        deviceId: payload.deviceId,
        userId: payload.userId,
      });
    const accessToken = jwtService.createAccessToken(payload.userId)
    await sessionsService.refreshSession(
      payload.deviceId,
      iat
    )
    return { accessToken, refreshToken: newRToken }
  },

  async recoverPassword(email: string): Promise<void> {
    const recoveryObj = await userService.setPasswordRecovery(email);
    if (!recoveryObj) {
      return
    }
    const emailTemplate = emailTemplates.passwordRecovery(recoveryObj.confirmationCode);

    await nodemailerService.sendEmail(
      email,
      emailTemplate
    ).catch(err => console.error(`Error sending email: ${err}`))
    return;
  },

  async confirmPassword(code: string, password: string): Promise<void> {
    this.validateUuid(code);
    const inputDto: ConfirmPasswordDto = {
      code: code as UUID,
      password
    }
    await userService.confirmPassword(inputDto);
  },

  validateUuid(code: string) {
    const isUuid = new RegExp(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    ).test(code);
    if (!isUuid) {
      throw new CustomError('provided code is not a valid uuid', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'code', message: 'invalid UUID' }] })
    }
  },
}
