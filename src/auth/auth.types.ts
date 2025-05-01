import { DeviceAuthSession } from "../security/session.entity";

export type LoginBody = {
  loginOrEmail: string;
  password: string;
}

export type LoginDto = {
  loginOrEmail: string;
  password: string;
  ip: string;
  title: string;
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

export type RefreshTokenRequest = {
  cookies: {
    refreshToken: string
  }
}

export interface CreateRefreshTokenDto {
  deviceId: string,
  userId: string
}

export interface RTokenPayload {
  iat: number,
  deviceId: string,
  userId: string,
}
