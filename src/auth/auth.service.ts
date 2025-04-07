import { usersRepository } from "../users/users.repository"
import bcrypt from 'bcrypt'
import { LoginDto } from "./auth.types";

export const authService = {
  async checkCredentials(credentials: LoginDto): Promise<boolean> {
    const user = await usersRepository.getUserByLoginOrEmail(credentials.loginOrEmail);

    const isValidPass = await bcrypt.compare(credentials.password, user.passwordHash);
    if (isValidPass) {
      return true
    }
    return false
  }
}
