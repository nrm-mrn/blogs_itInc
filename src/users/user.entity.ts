import { randomUUID, UUID } from "crypto";
import { SETTINGS } from "../settings/settings";
import { DateTime } from 'luxon'

export class User {
  login: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  emailConfirmation: EmailConfirmation;
  passwordRecovery: PasswordRecovery | null;
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
    this.passwordRecovery = null;
  }
  public static genConfirmationCode(): UUID {
    return randomUUID()
  }
  public static genPasswordRecovery(): PasswordRecovery {
    return {
      confirmationCode: User.genConfirmationCode(),
      expirationDate: DateTime.now().plus(SETTINGS.PASS_RECOVERY_EXPIRATION)
    }
  }
  public static genEmailConfirmtion(): EmailConfirmation {
    return {
      expirationDate: DateTime.now().plus(SETTINGS.EMAIL_EXPIRATION),
      confirmationCode: User.genConfirmationCode(),
      isConfirmed: false,
    }
  }
}

export interface EmailConfirmation {
  confirmationCode: UUID;
  expirationDate: DateTime;
  isConfirmed: boolean;
}

export interface PasswordRecovery {
  confirmationCode: UUID;
  expirationDate: DateTime;
}
