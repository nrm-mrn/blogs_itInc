import { Filter, ObjectId } from "mongodb";
import { usersCollection } from "../db/mongoDb";
import { PagedResponse } from "../shared/types/pagination.types";
import { GetUsersDto, IUserDb, IUserView } from "./user.types";
import { User } from "./user.entity";

export const usersQueryRepository = {

  getFilter(dto: GetUsersDto): Filter<User> {
    let searchLogin;
    let searchEmail;
    if ("searchLoginTerm" in dto && dto.searchLoginTerm !== null) {
      searchLogin = { login: { $regex: dto.searchLoginTerm!, $options: 'i' } }
    }
    if ("searchEmailTerm" in dto && dto.searchEmailTerm !== null) {
      searchEmail = { email: { $regex: dto.searchEmailTerm!, $options: 'i' } }
    }
    if (searchLogin) {
      if (searchEmail) {
        return { $or: [searchEmail, searchLogin] }
      }
      return { $or: [searchLogin] }
    }
    if (searchEmail) {
      return { $or: [searchEmail] }
    }
    return {}
  },

  async getAllUsers(dto: GetUsersDto): Promise<PagedResponse<IUserView>> {
    const filter = this.getFilter(dto)
    const paging = dto.pagination
    const users = await usersCollection
      .find(filter)
      .sort(paging.sortBy, paging.sortDirection)
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .toArray()
    const total = await usersCollection.countDocuments(filter);
    const usersView = users.map(user => {
      return { id: user._id, login: user.login, email: user.email, createdAt: user.createdAt }
    })
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: usersView,
    }
  },

  async getUserById(id: ObjectId): Promise<IUserView | null> {
    const user = await usersCollection.findOne({ _id: id })
    if (!user) {
      return null
    }
    return {
      id: user._id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt
    }
  },

  async getUserByLogin(login: string): Promise<IUserView | null> {
    const user = await usersCollection.findOne({ login })
    if (!user) {
      return null
    }
    return {
      id: user._id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt
    }
  },

  async getUserByEmail(email: string): Promise<IUserView | null> {
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return null
    }
    return {
      id: user._id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt
    }
  },

  async getUserByEmailConfirmation(code: string): Promise<IUserDb | null> {
    const user = await usersCollection.findOne({ 'emailConfirmation.confirmationCode': code })
    if (!user) {
      return null
    }
    return user
  },

  async getUserDbModelByEmail(email: string): Promise<IUserDb | null> {
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return null
    }
    return user
  }

}
