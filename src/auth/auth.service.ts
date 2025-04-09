import { usersRepository } from "../users/users.repository"
import { LoginDto, MeView } from "./auth.types";
import { ObjectId, WithId } from "mongodb";
import { usersQueryRepository } from "../users/usersQuery.repository";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { jwtService } from "./jwt.service";
import { passwordHashService } from "./passHash.service";
import { UserDbModel } from "../users/users.types";

export const authService = {
  async checkCredentials(credentials: LoginDto): Promise<{ accessToken: string }> {
    let user: WithId<UserDbModel>;
    try {
      user = await usersRepository.getUserByLoginOrEmail(credentials.loginOrEmail);
    }
    catch (err) {
      throw new CustomError('User not found by login or email', HttpStatuses.Unauthorized)
    }
    try {
      console.log(`Passing creds for compare pass: ${credentials.password}, hash: ${user.passwordHash}`)
      const isValidPass = await passwordHashService.compareHash(credentials.password, user.passwordHash);
      console.log('hash checked')
      if (isValidPass) {
        try {
          const userId = user._id.toString()
          console.log(`UserId: ${userId}`)
          return { accessToken: jwtService.createToken(userId) }
        } catch (err) {
          throw new CustomError(`Error creating string from objectId: ${err}`, HttpStatuses.ServerError)
        }
      }
      throw new CustomError('Wrong password', HttpStatuses.Unauthorized)
    } catch (err) {
      if (err instanceof CustomError) {
        throw new CustomError('Wrong password', HttpStatuses.Unauthorized)
      } else {
        throw new Error(`Could not check user credentials, error: ${err}`)
      }
    }
  },

  async getUserInfo(id: ObjectId): Promise<{ data: MeView }> {
    const user = await usersQueryRepository.getUserById(id);
    if (!user) {
      throw new Error('User id not found')
    }
    return { data: { email: user.email, login: user.login, userId: user.id.toString() } }
  }
}
