import { query } from "express-validator";
import { SortDirection } from "../../../shared/types/pagination.types";

const searchLoginTerm = query('searchLoginTerm')
  .customSanitizer((searchLoginTerm: string | undefined) => {
    return searchLoginTerm ? searchLoginTerm : null;
  })

const searchEmailTerm = query('searchEmailTerm')
  .customSanitizer((searchEmailTerm: string | undefined) => {
    return searchEmailTerm ? searchEmailTerm : null;
  })

const sortBy = query('sortBy')
  .customSanitizer((sortBy: string | undefined) => {
    return sortBy ? sortBy : 'createdAt';
  })

const sortDirection = query('sortDirection')
  .customSanitizer((sortDir: string | undefined) => {
    if (sortDir === 'asc' || sortDir === 'desc') {
      return sortDir as SortDirection;
    }
    return 'desc' as SortDirection;
  })

const pageSize = query('pageSize')
  .customSanitizer((pageSize: string | undefined) => {
    return pageSize ? +pageSize : 10;
  })

const pageNumber = query('pageNumber')
  .customSanitizer((pageNumber: string | undefined) => {
    return pageNumber ? +pageNumber : 1
  })

export const usersQuerySanChain = [
  searchLoginTerm,
  searchEmailTerm,
  sortBy,
  sortDirection,
  pageSize,
  pageNumber,
]
