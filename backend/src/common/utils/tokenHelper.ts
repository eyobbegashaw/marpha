import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface TokenPayload {
  userId: string;
  organizationId: string | null;
  branchId: string | null;
  role: string;
}

export const tokenHelper = {
  generateToken: (payload: TokenPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  },

  verifyToken: (token: string): TokenPayload => {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  },
};
