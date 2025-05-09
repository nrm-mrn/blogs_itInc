import { AuthSuccess, CreateRefreshTokenDto, LoginDto, RTokenPayload } from "./auth.types";
import { ObjectId, WithId } from "mongodb";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { JwtService } from "./jwt.service";
import { PasswordHashService } from "./passHash.service";
import { ConfirmPasswordDto, IUserDb, UserInputModel } from "../users/user.types";
import { MailerService } from "./email.service";
import { emailTemplates } from "./email.templates";
import { SessionsService } from "../security/sessions.service";
import { CreateSessionDto } from "../security/session.types";
import { UserService } from "../users/users.service";
import { UUID } from "crypto";
import { inject, injectable } from "inversify";

@injectable()
export class AuthService {

  constructor(
    @inject(SessionsService)
    private readonly sessionsService: SessionsService,
    @inject(UserService)
    private readonly userService: UserService,
    @inject(PasswordHashService)
    private readonly passHashService: PasswordHashService,
    @inject(MailerService)
    private readonly nomailerService: MailerService,
    @inject(JwtService)
    private readonly jwtService: JwtService,
  ) { };

  async checkCredentials(credentials: LoginDto): Promise<AuthSuccess> {
    let user: WithId<IUserDb>;
    let isValidPass: boolean;
    try {
      user = await this.userService.getUserByLoginOrEmail(credentials.loginOrEmail);
      isValidPass = await this.passHashService.compareHash(credentials.password, user.passwordHash);
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
    const accessToken = this.jwtService.createAccessToken(user._id.toString())
    const { token: rToken, iat } = this.jwtService.createRefreshToken(rtInput)

    const sessionInput: CreateSessionDto = {
      deviceId: rtInput.deviceId,
      userId: rtInput.userId,
      iat,
      ip: credentials.ip,
      title: credentials.title,
    }
    await this.sessionsService.saveSession(sessionInput);

    return { accessToken, refreshToken: rToken }
  }

  async registerUser(newUserDto: UserInputModel): Promise<ObjectId> {
    const { userId } = await this.userService.createUser(newUserDto);

    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new Error('Failed to create a new user entry')
    }

    const email = emailTemplates.registrationEmail(user.emailConfirmation.confirmationCode)


    this.nomailerService.sendEmail(
      user.email,
      email,
    ).catch(err => console.error(`error sending email: ${err}`))

    return userId
  }

  async confirmEmail(code: string): Promise<void> {
    this.validateUuid(code);
    const confirmationCode = code as UUID
    await this.userService.confirmEmail(confirmationCode);
    return;
  }

  async resendConfirmation(email: string): Promise<void> {
    const newConfirmation = await this.userService.updateEmailConfirmation(email)
    const emailTemplate = emailTemplates.registrationEmail(newConfirmation.confirmationCode)
    this.nomailerService.sendEmail(
      email,
      emailTemplate,
    ).catch(err => console.error(`error sending email: ${err}`))
    return
  }

  async reissueTokensPair(token: string): Promise<AuthSuccess> {
    //NOTE: should always work since guard check passed
    const payload = this.jwtService.verifyRefreshToken(token) as unknown as RTokenPayload

    const session = await this.sessionsService.getSession(payload.deviceId, payload.iat);
    if (!session) {
      throw new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
    }

    const { token: newRToken, iat } = this.jwtService.createRefreshToken(
      {
        deviceId: payload.deviceId,
        userId: payload.userId,
      });
    const accessToken = this.jwtService.createAccessToken(payload.userId)
    await this, this.sessionsService.refreshSession(
      payload.deviceId,
      iat
    )
    return { accessToken, refreshToken: newRToken }
  }

  async recoverPassword(email: string): Promise<void> {
    const recoveryObj = await this.userService.setPasswordRecovery(email);
    if (!recoveryObj) {
      return
    }
    const emailTemplate = emailTemplates.passwordRecovery(recoveryObj.confirmationCode);

    this.nomailerService.sendEmail(
      email,
      emailTemplate
    ).catch(err => console.error(`Error sending email: ${err}`))
    return;
  }

  async confirmPassword(code: string, password: string): Promise<void> {
    this.validateUuid(code);
    const inputDto: ConfirmPasswordDto = {
      code: code as UUID,
      password
    }
    await this.userService.confirmPassword(inputDto);
  }

  validateUuid(code: string) {
    const isUuid = new RegExp(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    ).test(code);
    if (!isUuid) {
      throw new CustomError('provided code is not a valid uuid', HttpStatuses.BadRequest, { errorsMessages: [{ field: 'recoveryCode', message: 'invalid UUID' }] })
    }
  }
}
