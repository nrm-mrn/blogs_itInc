import { Request } from "express";
import { IdType } from "./id.type";

export type RequestWithBody<B> = Request<{}, {}, B>;
export type RequestWithQuery<Q> = Request<{}, {}, {}, Q>;
export type RequestWithParams<P> = Request<P>;
export type RequestWithParamsAndQuery<P, Q> = Request<P, {}, {}, Q>;
export type RequestWithParamsAndBody<P, B> = Request<P, {}, B>;
export type RequestWithUserId<U extends IdType> = Request<{}, {}, {}, {}, U>
export type RequestWithParamsAndUserId<P, U extends IdType> = Request<P, {}, {}, {}, U>
export type RequestWithParamsBodyAndUserId<P, B, U extends IdType> = Request<P, {}, B, {}, U>
