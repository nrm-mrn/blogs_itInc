import { Collection, MongoClient } from "mongodb";
import { SETTINGS } from "../settings/settings";
import { ICommentDb } from "../comments/comments.types";
import { IBlogDb } from "../blogs/blogs.types";
import { IPostDb } from "../posts/posts.types";
import { IUserDb } from "../users/user.types";
import { ISessionDb } from "../security/session.types";
import { IRequestDb } from "../security/apiRequest.types";

export let blogsCollection: Collection<IBlogDb>;
export let postsCollection: Collection<IPostDb>;
export let usersCollection: Collection<IUserDb>;
export let commentsCollection: Collection<ICommentDb>;
export let sessionsCollection: Collection<ISessionDb>;
export let requestsCollection: Collection<IRequestDb>;
export let client: MongoClient;

export async function runDb(url: string): Promise<boolean> {
  client = new MongoClient(url);
  let db = client.db(SETTINGS.DB_NAME);

  blogsCollection = db.collection<IBlogDb>(SETTINGS.PATHS.BLOGS);
  postsCollection = db.collection<IPostDb>(SETTINGS.PATHS.POSTS);
  commentsCollection = db.collection<ICommentDb>(SETTINGS.PATHS.COMMENTS);
  usersCollection = db.collection<IUserDb>(SETTINGS.PATHS.USERS);
  sessionsCollection = db.collection<ISessionDb>(SETTINGS.PATHS.SECURITY);
  requestsCollection = db.collection<IRequestDb>(SETTINGS.PATHS.REQUESTS);

  await createIndexes()

  try {
    await client.connect();
    await db.command({ ping: 1 });
    return true
  } catch (e) {
    console.log(e)
    await client.close()
    return false
  }
}

export async function createIndexes() {
  await sessionsCollection.createIndex(
    { "expiration": 1 },
    { expireAfterSeconds: 0 }
  )
  await requestsCollection.createIndex(
    { 'expiration': 1 },
    { expireAfterSeconds: SETTINGS.REQUESTS_LIFETIME }
  )

}
