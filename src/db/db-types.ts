export type BlogViewModel = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
}

export type BlogInputModel = {
  name: string;
  description: string;
  websiteUrl: string;
}

export type PostViewModel = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
}

export type PostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export type UserModel = {
  auth: string;
}
