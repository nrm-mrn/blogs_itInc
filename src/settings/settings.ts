import { config } from "dotenv";

config()

export const SETTINGS = {
  PORT: process.env.PORT || 5000,
  PATHS: {
    BLOGS: '/blogs',
    POSTS: '/posts',
  },
  DB_NAME: process.env.DB_NAME || 'test',
  MONGO_URL: process.env.MONGO_URL || '',
  SUPERUSER: process.env.SUPERUSER
}
