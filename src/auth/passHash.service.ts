import bcrypt from 'bcrypt';

export const passwordHashService = {
  async createHash(password: string): Promise<string> {
    const saltRounds = 10
    try {
      const salt = await bcrypt.genSalt(saltRounds)
      const hash = await bcrypt.hash(password, salt);
      return hash
    }
    catch (err) {
      throw new Error('Error creating password hash')
    }
  },

  async compareHash(password: string, hash: string): Promise<boolean> {
    console.log(`Got creds for compare pass: ${password}, hash: ${hash}`)
    return bcrypt.compare(password, hash);
  }
}
