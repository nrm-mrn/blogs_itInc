import { query } from "express-validator";
import { SortDirection } from "../../../shared/types/pagination.types";

const searchNameTermV = query('searchNameTerm')
  .customSanitizer((searchTerm: string | undefined) => {
    return searchTerm ? searchTerm : null;
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

export const getBlogsSanitizerChain = [
  searchNameTermV,
  sortBy,
  sortDirection,
  pageSize,
  pageNumber,
]
