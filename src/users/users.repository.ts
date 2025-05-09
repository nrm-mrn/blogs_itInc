import { ObjectId, WithId } from "mongodb";
import { usersCollection } from "../db/mongoDb";
import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { EmailConfirmation, PasswordRecovery, User } from "./user.entity";
import { UUID } from "crypto";
import { IUserDb, IUserWithPassRecovery } from "./user.types";
import { injectable } from "inversify";

@injectable()
export class UsersRepository {

  async createUser(newUser: User): Promise<ObjectId> {
    const insertRes = await usersCollection.insertOne(newUser);
    if (insertRes.acknowledged) {
      return insertRes.insertedId
    }
    throw new Error('Failed to insert a user')
  }

  async getUserById(id: ObjectId): Promise<WithId<IUserDb> | null> {
    return usersCollection.findOne({ _id: id });
  }

  async deleteUser(id: ObjectId): Promise<void> {
    const res = await usersCollection.deleteOne({ _id: id })
    if (!res.acknowledged) {
      throw new Error('Failed to delete a user')
    }
    if (res.deletedCount === 0) {
      throw new CustomError('User not found', HttpStatuses.NotFound)
    }
  }

  async getUserByLoginOrEmail(input: string): Promise<WithId<IUserDb> | null> {
    const user = await usersCollection.findOne({ $or: [{ login: input }, { email: input }] })
    return user
  }

  async getUserByEmail(input: string): Promise<WithId<IUserDb> | null> {
    const user = await usersCollection.findOne({ email: input })
    return user
  }

  async getUserByEmailConfirmation(code: UUID): Promise<WithId<IUserDb> | null> {
    const user = await usersCollection.findOne({ 'emailConfirmation.confirmationCode': code })
    if (!user) {
      return null
    }
    return user
  }

  async confirmEmail(id: ObjectId): Promise<void> {
    const res = await usersCollection.updateOne({ _id: id }, { $set: { "emailConfirmation.isConfirmed": true } })
    if (res.modifiedCount !== 1) {
      throw new Error('Failed to write email as confirmed')
    }
    return
  }

  async updateEmailConfirmation(email: string, newConfirmation: EmailConfirmation): Promise<void> {
    const res = await usersCollection.updateOne({ email }, { $set: { emailConfirmation: newConfirmation } })

    if (res.modifiedCount !== 1) {
      throw new Error('Failed to regenerate email confirmation')
    }
    return
  }

  async recoverPassword(email: string, recoveryObj: PasswordRecovery): Promise<void> {
    const res = await usersCollection.updateOne({ email }, { $set: { passwordRecovery: recoveryObj } })

    if (res.modifiedCount !== 1) {
      throw new Error('Failed to insert password recovery obj')
    }
    return
  }

  async cleanPassRecovery(id: ObjectId): Promise<void> {
    const res = await usersCollection.updateOne({ _id: id }, { $set: { passwordRecovery: null } })

    if (res.modifiedCount !== 1) {
      throw new Error('Failed to clead pass recovery object')
    }
    return
  }

  async getUserByPassRecovery(code: UUID): Promise<WithId<IUserWithPassRecovery> | null> {
    const user = usersCollection.findOne(
      { "passwordRecovery.confirmationCode": code }
    )
    if (!user) {
      return null
    }
    return user as unknown as WithId<IUserWithPassRecovery>;
  }

  async updatePassword(id: ObjectId, hash: string): Promise<void> {
    const res = await usersCollection.updateOne({ _id: id }, { $set: { passwordHash: hash } })
    if (res.modifiedCount !== 1) {
      throw new Error('Failed to update password hash');
    }
    return
  }

}
