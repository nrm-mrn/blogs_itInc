import { config } from "dotenv";
import { Duration } from 'luxon'

config()

export const SETTINGS = {
  ENV: process.env.ENV || 'production',
  PORT: process.env.PORT || 5000,
  PATHS: {
    BLOGS: '/blogs',
    POSTS: '/posts',
    USERS: '/users',
    AUTH: '/auth',
    COMMENTS: '/comments',
    RTOKEN: '/refresh-tokens'
  },
  DB_NAME: process.env.DB_NAME || 'test',
  MONGO_URL: process.env.MONGO_URL || '',
  SUPERUSER: process.env.SUPERUSER,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_TIME: +process.env.JWT_TIME! as number,
  REFRESHT_TIME: +process.env.REFRESHT_TIME! as number,
  EMAIL: process.env.EMAIL as string,
  EMAIL_PASS: process.env.EMAIL_PASS as string,
  TEST_DOMAIN: process.env.TEST_DOMAIN || 'localhost',
  EMAIL_EXPIRATION: Duration.fromObject({ minutes: 10 }),
}
