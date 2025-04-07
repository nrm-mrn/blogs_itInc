import { ObjectId } from "mongodb";
import { UserDbModel } from "../db/db-types";
import { usersCollection } from "../db/mongoDb";
import { usersQueryRepository } from "./usersQuery.repository";

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
      throw new Error('User not found')
    }
    const res = await usersCollection.deleteOne({ _id: id })
    if (res.acknowledged) {
      return;
    }
    throw new Error('Falied to delete a user')
  },

  async getUserByLoginOrEmail(input: string): Promise<UserDbModel> {
    const user = await usersCollection.findOne({ $or: [{ login: input }, { email: input }] })
    if (!user) {
      throw new Error('User not found')
    }
    return user
  }
}
