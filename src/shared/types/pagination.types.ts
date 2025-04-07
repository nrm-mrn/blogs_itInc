export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
};

export type PagingQuery = {
  sortDirection?: SortDirection;
  sortBy?: string;
  pageSize?: number;
  pageNumber?: number;
}

export type PagingFilter = {
  sortDirection: SortDirection;
  sortBy: string;
  pageSize: number;
  pageNumber: number;
}

export type PagedResponse<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}
