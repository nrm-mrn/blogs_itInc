import { ObjectId, WithId } from "mongodb";
import { usersCollection } from "../db/mongoDb";
import { usersQueryRepository } from "./usersQuery.repository";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { EmailConfirmation, User } from "./user.entity";

export const usersRepository = {

  async createUser(newUser: User): Promise<ObjectId> {
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

  async getUserByLoginOrEmail(input: string): Promise<WithId<User>> {
    const user = await usersCollection.findOne({ $or: [{ login: input }, { email: input }] })
    if (!user) {
      throw new CustomError('User not found', HttpStatuses.NotFound)
    }
    return user
  },

  async confirmEmail(email: string): Promise<void> {
    const res = await usersCollection.updateOne({ email }, { $set: { "emailConfirmation.isConfirmed": true } })
    if (res.modifiedCount !== 1) {
      throw new Error('Failed to write email as confirmed')
    }
    return
  },

  async updateEmailConfirmation(email: string, newConfirmation: EmailConfirmation): Promise<void> {
    const res = await usersCollection.updateOne({ email }, { $set: { emailConfirmation: newConfirmation } })

    if (res.modifiedCount !== 1) {
      throw new Error('Failed to regenerate email confirmation')
    }
    return
  },
}
