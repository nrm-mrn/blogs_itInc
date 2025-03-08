import { db } from "../db/db"

export const getAdmin = () => {
  return db.users[0]
}
