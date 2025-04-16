import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";
import { User } from "./user.entity";

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

export interface IUserDb extends User { };

export interface IUserView {
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

