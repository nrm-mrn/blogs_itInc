import { RefreshToken } from "./refreshToken.entity";

export type LoginBody = {
  loginOrEmail: string;
  password: string;
}

export type LoginDto = {
  loginOrEmail: string;
  password: string;
}

export type LoginInputModel = {
  loginOrEmail: string;
  password: string;
}

export type MeView = {
  email: string;
  login: string;
  userId: string;
}

export interface AuthSuccess {
  accessToken: string;
  refreshToken: string;
}

export interface IRTokenDb extends RefreshToken { }

export type RefreshTokenRequest = {
  cookies: {
    refreshToken: string
  }
}
