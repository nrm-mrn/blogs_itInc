import { ObjectId } from "mongodb";

export type BlogViewModel = {
  id: ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export type BlogDbModel = {
  _id: ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export type UserDbModel = {
  login: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export type UserViewModel = {
  id: ObjectId;
  login: string;
  email: string;
  createdAt: string;
}

export type UserInputModel = {
  login: string;
  password: string;
  email: string;
}

export type LoginInputModel = {
  loginOrEmail: string;
  password: string;
}

export type BlogInputModel = {
  name: string;
  description: string;
  websiteUrl: string;
}

export type PostViewModel = {
  id: ObjectId;
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
  blogName: string;
  createdAt: string;
}

export type PostDbModel = {
  _id: ObjectId;
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
  blogName: string;
  createdAt: string;
}

export type PostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: ObjectId;
}

export type BlogPostInputModel = {
  title: string;
  shortDescription: string;
  content: string;
}

