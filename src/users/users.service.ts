import { ObjectId } from "mongodb";
import { UserDbModel, UserInputModel, UserViewModel } from "../db/db-types";
import { usersQueryRepository } from "./usersQuery.repository";
import bcrypt from 'bcrypt';
import { usersRepository } from "./users.repository";

export const userService = {
  async createUser(input: UserInputModel): Promise<UserViewModel> {
    const uniqueLogin = await this.isLoginUnique(input.login)
    if (!uniqueLogin) {
      throw new Error('Login should be unique');
    }
    const uniqueEmail = await this.isEmailUnique(input.email)
    if (!uniqueEmail) {
      throw new Error('Email should be unique');
    }

    const datetime = new Date();
    const datetimeISO = datetime.toISOString();
    const hash = await this.createPwdHash(input.password);
    if (!hash) {
      throw new Error('Failed to create hash');
    }
    const newUser: UserDbModel = {
      createdAt: datetimeISO,
      passwordHash: hash,
      ...input
    }
    const userId = await usersRepository.createUser(newUser)

    return { id: userId, login: newUser.login, email: newUser.email, createdAt: newUser.createdAt }
  },

  async createPwdHash(password: string): Promise<string | null> {
    const saltRounds = 10
    try {
      const salt = await bcrypt.genSalt(saltRounds)
      const hash = await bcrypt.hash(password, salt);
      return hash
    }
    catch (err) {
      console.error('Generating hash failed')
    }
    return null
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
