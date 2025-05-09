import { ObjectId } from "mongodb";
import { AuthService } from "../../src/auth/auth.service";
import { MailerService } from "../../src/auth/email.service";
import { client, runDb, usersCollection } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { insertUser, testingDtosCreator, testSeeder } from "../test-helpers";
import { User } from "../../src/users/user.entity";
import { DateTime } from "luxon";
import { randomUUID } from "crypto";
import { UsersRepository } from "../../src/users/users.repository";
import { container } from "../../src/ioc";

describe('auth integration tests', () => {
  let usersRepository: UsersRepository;
  let authService: AuthService;

  const nodemailerService = {
    sendEmail: jest.fn().mockResolvedValue(true),
  } as unknown as MailerService;

  beforeAll(async () => {
    const res = await runDb(SETTINGS.MONGO_URL)
    if (!res) {
      process.exit(1)
    }
    await usersCollection.drop()
    await container.unbind(MailerService)
    container.bind(MailerService).toConstantValue(nodemailerService);
    usersRepository = container.get(UsersRepository)
    authService = container.get(AuthService)
  })

  beforeEach(async () => {
    await usersCollection.drop()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await client.close()
  })

  describe('User registration', () => {

    it('should register user with correct data', async () => {
      const { login, pass: password, email } = testingDtosCreator.createUserDto({ login: '12345', email: 'sfsaf@mail.com', pass: 'sdfwe12' });

      const result = await authService.registerUser({ email, login, password });

      expect(ObjectId.isValid(result)).toEqual(true);
      expect(nodemailerService.sendEmail).toHaveBeenCalled()
      expect(nodemailerService.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should not register user twice', async () => {
      const { login, pass: password, email } = testingDtosCreator.createUserDto({});
      await testSeeder.createUsers([{ login, password, email }]);

      await expect(authService.registerUser({ login, email, password })).rejects.toThrow(/already exists/i)

      expect(await usersCollection.countDocuments()).toBe(1)

    });
  })

  describe('Email confirmation', () => {

    const code = randomUUID()

    it('should not confirm email if user does not exist', async () => {
      await expect(authService.confirmEmail(code)).rejects.toThrow(/does not exist/i)
    });

    it('should not confirm email which is confirmed', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      user.emailConfirmation.isConfirmed = true;
      user.emailConfirmation.confirmationCode = code
      await insertUser(user);

      await expect(authService.confirmEmail(code)).rejects.toThrow(/been confirmed/i)

    });

    it('should not confirm email with expired code', async () => {
      const code = randomUUID()
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      user.emailConfirmation.expirationDate = DateTime.now();
      user.emailConfirmation.confirmationCode = code;
      await insertUser(user);

      await expect(authService.confirmEmail(code)).rejects.toThrow(/expired/i)

      const dbUser = await usersRepository.getUserByEmailConfirmation(code);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(false)
    });


    it('confirm user', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      await insertUser(user);

      await authService.confirmEmail(user.emailConfirmation.confirmationCode)

      const dbUser = await usersRepository.getUserByEmailConfirmation(user.emailConfirmation.confirmationCode);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(true)
    });
  })

  describe('resend confirmation', () => {

    it('should not confirm email with expired code', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      await insertUser(user);

      await expect(authService.resendConfirmation('wrongEmail@gmail.com')).rejects.toThrow(/does not exist/i)

      const mockUuid = randomUUID()
      jest.spyOn(User, 'genConfirmationCode').mockReturnValue(mockUuid)
      await authService.resendConfirmation(user.email);
      expect(nodemailerService.sendEmail).toHaveBeenCalled()
      expect(nodemailerService.sendEmail).toHaveBeenCalledTimes(1)

      const dbUser = await usersRepository.getUserByEmailConfirmation(mockUuid);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(false)
    });
  })
}
)
