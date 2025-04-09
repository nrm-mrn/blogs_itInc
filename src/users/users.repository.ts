import { ObjectId, WithId } from "mongodb";
import { usersCollection } from "../db/mongoDb";
import { usersQueryRepository } from "./usersQuery.repository";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { UserDbModel } from "./users.types";

export const usersRepository = {

  async createUser(newUser: UserDbModel): Promise<ObjectId> {
    const insertRes = await usersCollection.insertOne(newUser);
    if (insertRes.acknowledged) {
      return insertRes.insertedId
    }
    throw new Error('Failed to insert a user')
  },

  async deleteUser(id: ObjectId): Promise<void> {
    const user = await usersQueryRepository.getUserById(id)
    if (!user) {
      throw new CustomError('User not found', HttpStatuses.NotFound)
    }
    const res = await usersCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      return;
    }
    throw new Error('Failed to delete a user')
  },

  async getUserByLoginOrEmail(input: string): Promise<WithId<UserDbModel>> {
    const user = await usersCollection.findOne({ $or: [{ login: input }, { email: input }] })
    if (!user) {
      throw new CustomError('User not found', HttpStatuses.NotFound)
    }
    return user
  }
}
