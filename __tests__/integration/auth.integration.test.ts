import { ObjectId, UUID } from "mongodb";
import { authService } from "../../src/auth/auth.service";
import { nodemailerService } from "../../src/auth/email.service";
import { client, createIndexes, rTokensCollection, runDb, usersCollection } from "../../src/db/mongoDb";
import { SETTINGS } from "../../src/settings/settings";
import { createUser, insertUser, loginUser, req, testingDtosCreator, testSeeder, UserDto } from "../test-helpers";
import { User } from "../../src/users/user.entity";
import { DateTime, Duration } from "luxon";
import { usersQueryRepository } from "../../src/users/usersQuery.repository";
import { randomUUID } from "crypto";
import { userService } from "../../src/users/users.service";
import { RefreshToken } from "../../src/auth/refreshToken.entity";
import { rTokensRepository } from "../../src/auth/auth.repository";

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
    const confirmEmailUseCase = authService.confirmEmail;
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

      const dbUser = await usersQueryRepository.getUserByEmailConfirmation(code);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(false)
    });


    it('confirm user', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      const user = new User(login, email, '22qfwfdsafsaf')
      await insertUser(user);

      await confirmEmailUseCase(user.emailConfirmation.confirmationCode)

      const dbUser = await usersQueryRepository.getUserByEmailConfirmation(user.emailConfirmation.confirmationCode);
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

    const resendConfirmUseCase = authService.resendConfirmation

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

      const dbUser = await usersQueryRepository.getUserByEmailConfirmation(mockUuid);
      expect(dbUser).toBeTruthy()
      expect(dbUser!.emailConfirmation.isConfirmed).toBe(false)
    });
  })

  describe('refresh token invalidation', () => {
    beforeAll(async () => {
      await rTokensCollection.drop()
      await createIndexes()
    })

    nodemailerService.sendEmail = jest
      .fn()
      .mockImplementation(
        (email: string, template: string) =>
          Promise.resolve(true)
      );

    it('should delete old token when issuing new one', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      await createUser();
      const tokens1 = await authService.checkCredentials({ loginOrEmail: login, password: pass })
      let rTokenDb = await rTokensCollection.findOne({ token: tokens1.refreshToken })
      expect(rTokenDb).not.toBeNull()

      const tokens2 = await authService.reissueTokensPair(tokens1.refreshToken);

      rTokenDb = await rTokensCollection.findOne({ token: tokens1.refreshToken })
      expect(rTokenDb).toBeNull()

      rTokenDb = await rTokensCollection.findOne({ token: tokens2.refreshToken })
      expect(tokens2.refreshToken).not.toBeNull()
    })

    it('should delete a token when loggin user out', async () => {
      const { login, pass, email } = testingDtosCreator.createUserDto({});
      await createUser();
      const tokens = await authService.checkCredentials({ loginOrEmail: login, password: pass })
      let rTokenDb = await rTokensCollection.findOne({ token: tokens.refreshToken })
      expect(rTokenDb).not.toBeNull()

      await authService.revokeRefreshToken(tokens.refreshToken);

      rTokenDb = await rTokensCollection.findOne({ token: tokens.refreshToken })
      expect(rTokenDb).toBeNull()
    })

    it.skip('token should be deleted from db when expired', async () => {
      const userId = new ObjectId()
      const token = new RefreshToken(userId.toString())
      token.expiration = DateTime.utc().plus(Duration.fromMillis(500)).toJSDate()
      await rTokensRepository.saveRefreshToken(token);

      //check it is in db
      let dbEntry = await rTokensRepository.getRefreshToken(token.token)
      expect(dbEntry).not.toBeNull()

      //mongo runs deletion job only once in 60 second, so have to wait long
      //in order to check it
      await new Promise(resolve => setTimeout(resolve, 65000))

      //check it is not in db
      dbEntry = await rTokensRepository.getRefreshToken(token.token)
      expect(dbEntry).toBeNull()
    }, 70000)
  })

}

)
