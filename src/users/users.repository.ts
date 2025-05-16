import { ObjectId } from "../shared/types/objectId.type";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { UserDocument, UserModel } from "./user.entity";
import { UUID } from "crypto";
import { injectable } from "inversify";

@injectable()
export class UsersRepository {

  async save(user: UserDocument): Promise<ObjectId> {
    const res = await user.save()
    return res._id
  }

  async findUserById(id: ObjectId): Promise<UserDocument | null> {
    return UserModel.findById(id);
  }

  async getUserById(id: ObjectId): Promise<UserDocument> {
    const user = await UserModel.findById(id).orFail(
      new CustomError('User not found', HttpStatuses.NotFound)
    )
    return user
  }

  async deleteUser(user: UserDocument): Promise<boolean> {
    const res = await user.deleteOne()
    if (!res.acknowledged) {
      throw new Error('Failed to delete a user')
    }
    return true
  }

  async findUserByLoginOrEmail(input: string): Promise<UserDocument | null> {
    const user = UserModel.findOne().or([{ login: input }, { email: input }])
    return user
  }

  async findUserByEmail(input: string): Promise<UserDocument | null> {
    const user = await UserModel.findOne({ email: input })
    return user
  }

  async findUserByEmailConfirmation(code: UUID): Promise<UserDocument | null> {
    return UserModel.findOne({ 'emailConfirmation.confirmationCode': code })
  }

  async getUserByPassRecovery(code: UUID): Promise<UserDocument | null> {
    const user = UserModel.findOne(
      { "passwordRecovery.confirmationCode": code }
    )
    if (!user) {
      return null
    }
    return user;
  }
}
