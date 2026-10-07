import bcrypt from 'bcryptjs';

export const hashHelper = {
  hash: async (plain: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  },
  compare: async (plain: string, hashed: string): Promise<boolean> => {
    return bcrypt.compare(plain, hashed);
  },
};
