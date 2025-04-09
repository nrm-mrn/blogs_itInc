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
      const isValidPass = await passwordHashService.compareHash(credentials.password, user.passwordHash);
      if (isValidPass) {
        return { accessToken: jwtService.createToken(user._id.toString()) }
      }
      throw new CustomError('Wrong password', HttpStatuses.Unauthorized)
    } catch (err) {
      if (err instanceof CustomError) {
        throw new CustomError('Wrong password', HttpStatuses.Unauthorized)
      } else {
        throw new Error('Could not check user credentials')
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
