import { ObjectId } from "../../shared/types/objectId.type";
import { PagingFilter } from "../../shared/types/pagination.types";

export type GetPostsDto = {
  pagination: PagingFilter;
  userId?: ObjectId;
}
