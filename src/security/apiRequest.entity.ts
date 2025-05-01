import { DateTime } from "luxon";

export class ApiRequest {
  ip: string;
  URL: string;
  date: Date;
  constructor(ip: string, URL: string) {
    this.ip = ip;
    this.URL = URL;
    this.date = DateTime.utc().toJSDate();
  }
}
