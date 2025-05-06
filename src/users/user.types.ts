import { ObjectId } from "mongodb";
import { PagingFilter, PagingQuery } from "../shared/types/pagination.types";
import { PasswordRecovery, User } from "./user.entity";
import { UUID } from "crypto";

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

export type ConfirmPasswordDto = {
  code: UUID;
  password: string;
}

export interface IUserDb extends User { };

export interface IUserWithPassRecovery extends User {
  passwordRecovery: PasswordRecovery;
}

export interface IUserView {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

export type UserInputModel = {
  login: string;
  password: string;
  email: string;
}

