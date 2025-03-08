import { BlogViewModel, PostViewModel, UserModel } from "./db-types"


export type DBtype = {
  users: UserModel[];
  blogs: BlogViewModel[];
  posts: PostViewModel[];
}

export const db: DBtype = {
  users: [],
  blogs: [],
  posts: [],
}

export const setDb = (dataset?: Partial<DBtype>) => {
  //always set an admin user
  db.users = [{ auth: 'admin:qwerty' }]
  if (!dataset) {
    db.blogs = [];
    db.posts = [];
    return;
  }

  db.blogs = dataset.blogs || db.blogs;
  db.posts = dataset.posts || db.posts;

}
