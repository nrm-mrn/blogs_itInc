import { randomUUID, UUID } from "crypto";
import { SETTINGS } from "../settings/settings";
import { DateTime } from 'luxon'
import mongoose, { HydratedDocument, Schema } from "mongoose";
import { IUserWithPassRecovery } from "./user.types";

export class User {
  login: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  emailConfirmation: EmailConfirmation;
  passwordRecovery: PasswordRecovery | null;
  constructor(login: string, email: string, hash: string) {
    this.login = login
    this.email = email
    this.passwordHash = hash
    this.createdAt = new Date()
    this.emailConfirmation = {
      expirationDate: DateTime.now().plus(SETTINGS.EMAIL_EXPIRATION).toJSDate(),
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
      expirationDate: DateTime.now().plus(SETTINGS.PASS_RECOVERY_EXPIRATION).toJSDate()
    }
  }
  public static genEmailConfirmtion(): EmailConfirmation {
    return {
      expirationDate: DateTime.now().plus(SETTINGS.EMAIL_EXPIRATION).toJSDate(),
      confirmationCode: User.genConfirmationCode(),
      isConfirmed: false,
    }
  }
}

export interface EmailConfirmation {
  confirmationCode: UUID;
  expirationDate: Date;
  isConfirmed: boolean;
}

export interface PasswordRecovery {
  confirmationCode: UUID;
  expirationDate: Date;
}

export const EmailConfirmationSchema = new Schema<EmailConfirmation>({
  confirmationCode: { type: String, required: true },
  expirationDate: { type: Date, required: true },
  isConfirmed: { type: Boolean, required: true },
})

export const PasswordRecoverySchema = new Schema<PasswordRecovery>({
  confirmationCode: { type: String, required: true },
  expirationDate: { type: Date, required: true },
})

export const UserSchema = new Schema<User>({
  email: { type: String, required: true, unique: true },
  login: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  emailConfirmation: { type: EmailConfirmationSchema, required: true },
  passwordRecovery: { type: PasswordRecoverySchema, required: false },
},
  {
    timestamps: { createdAt: true, updatedAt: false }
  })

export const UserModel = mongoose.model<User>(SETTINGS.PATHS.USERS, UserSchema)

export type UserDocument = HydratedDocument<User>
export type UserDocWithPassRecovery = HydratedDocument<IUserWithPassRecovery>
