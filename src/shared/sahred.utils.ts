import mongoose from "mongoose";
import { ObjectId } from "./types/objectId.type";

export function createObjId(id: string): ObjectId {
  return new mongoose.Types.ObjectId(id)
}
