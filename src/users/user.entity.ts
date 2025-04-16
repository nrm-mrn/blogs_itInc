import { randomUUID, UUID } from "crypto";
import { SETTINGS } from "../settings/settings";
import { DateTime } from 'luxon'

export class User {
  login: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  emailConfirmation: EmailConfirmation
  constructor(login: string, email: string, hash: string) {
    this.login = login
    this.email = email
    this.passwordHash = hash
    this.createdAt = new Date().toISOString()
    this.emailConfirmation = {
      expirationDate: DateTime.now().plus(SETTINGS.EMAIL_EXPIRATION),
      confirmationCode: User.genConfirmationCode(),
      isConfirmed: false
    }
  }
  public static genConfirmationCode(): UUID {
    return randomUUID()
  }
}

export interface EmailConfirmation {
  confirmationCode: string;
  expirationDate: DateTime;
  isConfirmed: boolean;
}
