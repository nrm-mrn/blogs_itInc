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


