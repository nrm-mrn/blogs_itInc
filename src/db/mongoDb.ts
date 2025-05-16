import { SETTINGS } from "../settings/settings";
import mongoose from "mongoose";
import { DeviceSessionModel } from "../security/session.entity";
import { ApiReqModel } from "../security/apiRequest.entity";

export async function runDb(): Promise<boolean> {
  try {
    await mongoose.connect(SETTINGS.MONGO_URL + `/${SETTINGS.DB_NAME}`, {
      autoIndex: true
    })
    await createIndexes()
    return true
  } catch (e) {
    console.log(e)
    await mongoose.connection.close()
    return false
  }
}

export async function createIndexes() {
  await DeviceSessionModel.syncIndexes()
  await ApiReqModel.syncIndexes()

}
