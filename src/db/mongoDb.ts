import { Collection, MongoClient } from "mongodb";
import { SETTINGS } from "../settings/settings";
import { CommentDbModel } from "../comments/comments.types";
import { BlogDbModel } from "../blogs/blogs.types";
import { PostDbModel } from "../posts/posts.types";
import { UserDbModel } from "../users/users.types";

export let blogsCollection: Collection<BlogDbModel>;
export let postsCollection: Collection<PostDbModel>;
export let usersCollection: Collection<UserDbModel>;
export let commentsCollection: Collection<CommentDbModel>;
export let client: MongoClient;

export async function runDb(url: string): Promise<boolean> {
  client = new MongoClient(url);
  let db = client.db(SETTINGS.DB_NAME);

  blogsCollection = db.collection<BlogDbModel>(SETTINGS.PATHS.BLOGS);
  postsCollection = db.collection<PostDbModel>(SETTINGS.PATHS.POSTS);
  commentsCollection = db.collection<CommentDbModel>(SETTINGS.PATHS.COMMENTS);
  usersCollection = db.collection<UserDbModel>(SETTINGS.PATHS.USERS);

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
