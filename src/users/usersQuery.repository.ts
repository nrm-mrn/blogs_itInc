import { ObjectId } from "../shared/types/objectId.type";
import { PagedResponse } from "../shared/types/pagination.types";
import { GetUsersDto, IUserView } from "./user.types";
import { UserModel } from "./user.entity";
import { MeView } from "../auth/auth.types";
import { injectable } from "inversify";

@injectable()
export class UsersQueryRepository {

  getFilter(dto: GetUsersDto) {
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
  }

  async getAllUsers(dto: GetUsersDto): Promise<PagedResponse<IUserView>> {
    const filter = this.getFilter(dto)
    const paging = dto.pagination
    const users = await UserModel
      .find(filter)
      .sort({ [paging.sortBy]: paging.sortDirection })
      .skip((paging.pageNumber - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .exec()
    const total = await UserModel.countDocuments(filter).exec()
    const usersView = users.map(user => {
      return {
        id: user._id.toString(),
        login: user.login,
        email: user.email,
        createdAt: user.createdAt.toISOString()
      }
    })
    return {
      pagesCount: Math.ceil(total / paging.pageSize),
      page: paging.pageNumber,
      pageSize: paging.pageSize,
      totalCount: total,
      items: usersView,
    }
  }

  async getUserById(id: ObjectId): Promise<IUserView | null> {
    //for users router post method
    const user = await UserModel.findById(id)
    if (!user) {
      return null
    }
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString()
    }
  }

  async getUserInfo(id: ObjectId): Promise<MeView | null> {
    const user = await UserModel.findById(id)
    if (!user) {
      return null
    }
    return {
      userId: user._id.toString(),
      email: user.email,
      login: user.login,
    }
  }
}
