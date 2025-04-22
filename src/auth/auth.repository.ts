import { ObjectId } from "mongodb";
import { RefreshToken } from "./refreshToken.entity";
import { rTokensCollection } from "../db/mongoDb";

export const rTokensRepository = {
  async saveRefreshToken(token: RefreshToken): Promise<ObjectId> {
    const insertRes = await rTokensCollection.insertOne(token);
    if (insertRes.acknowledged) {
      return insertRes.insertedId
    }
    throw new Error('Failed to save refresh token')
  },

  async deleteRefreshToken(token: string): Promise<void> {
    const entry = await rTokensCollection.findOne({ token })
    if (!entry) {
      throw new Error('Token db entry not found by token value')
    }
    const res = await rTokensCollection.deleteOne({ token })
    if (res.acknowledged) {
      return;
    }
    throw new Error('Failed to delete a token, operation not acknowledged by db')
  },

  async getRefreshToken(token: string): Promise<RefreshToken | null> {
    const tokenEntry = await rTokensCollection.findOne({ token })
    if (!tokenEntry) {
      return null
    }
    return tokenEntry
  }
}
