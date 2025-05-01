import { DeviceAuthSession } from "../security/session.entity";

export interface IDeviceView {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
}

export interface ISessionDb extends DeviceAuthSession { };

export interface CreateSessionDto {
  deviceId: string,
  userId: string,
  iat: string,
  ip: string,
  title: string,
}
