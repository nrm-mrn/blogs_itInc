import { param, query } from "express-validator";
import { SortDirection } from "../types/pagination.types";
import { ObjectId } from "mongodb";

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

export const idToObjectId = param('id')
  .customSanitizer(id => new ObjectId(id))

export const querySanitizerChain = [
  sortBy,
  sortDirection,
  pageSize,
  pageNumber,
]
