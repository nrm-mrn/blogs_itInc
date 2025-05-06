import { ObjectId } from "mongodb";
import { authService } from "../../src/auth/auth.service";
import { nodemailerService } from "../../src/auth/email.service";
import { client, runDb, usersCollection } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { createUser, insertUser, testingDtosCreator } from "../test-helpers";
import { User } from "../../src/users/user.entity";
import { DateTime } from "luxon";
import { randomUUID } from "crypto";
import { usersRepository } from "../../src/users/users.repository";

describe('auth integration tests', () => {
  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await usersCollection.drop()
  })

  beforeEach(async () => {
    await usersCollection.drop()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await client.close()
  })

  describe('User registration', () => {
    nodemailerService.sendEmail = jest
      .fn()
      .mockImplementation(
        (email: string, template: string) =>
          Promise.resolve(true)
      );

    const registerUserUseCase = authService.registerUser;

    it('should register user with correct data', async () => {
      const { login, pass: password, email } = testingDtosCreator.createUserDto({ login: '12345', email: 'sfsaf@mail.com', pass: 'sdfwe12' });

      const result = await registerUserUseCase({ email, login, password });

      expect(ObjectId.isValid(result)).toEqual(true);
      expect(nodemailerService.sendEmail).toHaveBeenCalled()
      expect(nodemailerService.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should not register user twice', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      await createUser({ login, pass, email });

      await expect(registerUserUseCase({ login, email, password: pass })).rejects.toThrow(/already exists/i)

      expect(await usersCollection.countDocuments()).toBe(1)

    });
  })

  describe('Email confirmation', () => {
    const confirmEmailUseCase = authService.confirmEmail.bind(authService)
    const code = randomUUID()

    it('should not confirm email if user does not exist', async () => {
      await expect(confirmEmailUseCase(code)).rejects.toThrow(/does not exist/i)
    });

    it('should not confirm email which is confirmed', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      user.emailConfirmation.isConfirmed = true;
      user.emailConfirmation.confirmationCode = code
      await insertUser(user);

      await expect(confirmEmailUseCase(code)).rejects.toThrow(/been confirmed/i)

    });

    it('should not confirm email with expired code', async () => {
      const code = randomUUID()
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      user.emailConfirmation.expirationDate = DateTime.now();
      user.emailConfirmation.confirmationCode = code;
      await insertUser(user);

      await expect(confirmEmailUseCase(code)).rejects.toThrow(/expired/i)

      const dbUser = await usersRepository.getUserByEmailConfirmation(code);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(false)
    });


    it('confirm user', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      await insertUser(user);

      await confirmEmailUseCase(user.emailConfirmation.confirmationCode)

      const dbUser = await usersRepository.getUserByEmailConfirmation(user.emailConfirmation.confirmationCode);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(true)
    });
  })

  describe('resend confirmation', () => {

    nodemailerService.sendEmail = jest
      .fn()
      .mockImplementation(
        (email: string, template: string) =>
          Promise.resolve(true)
      );

    const resendConfirmUseCase = authService.resendConfirmation.bind(authService)

    it('should not confirm email with expired code', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      await insertUser(user);

      await expect(resendConfirmUseCase('wrongEmail@gmail.com')).rejects.toThrow(/does not exist/i)

      const mockUuid = randomUUID()
      jest.spyOn(User, 'genConfirmationCode').mockReturnValue(mockUuid)
      await resendConfirmUseCase(user.email);
      expect(nodemailerService.sendEmail).toHaveBeenCalled()
      expect(nodemailerService.sendEmail).toHaveBeenCalledTimes(1)

      const dbUser = await usersRepository.getUserByEmailConfirmation(mockUuid);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(false)
    });
  })
}
)
