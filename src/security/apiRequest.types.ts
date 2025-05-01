import { ApiRequest } from "./apiRequest.entity";

export interface IRequestDb extends ApiRequest { }

export interface CreateRequestDto {
  ip: string;
  URL: string;
}
