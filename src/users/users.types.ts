import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";

export type GetUsersQuery = {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
} & PagingQuery

export type GetUsersSanitizedQuery = {
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
} & PagingFilter;

export type GetUsersDto = {
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
  pagination: PagingFilter;
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

