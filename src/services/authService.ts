import jwt from "jsonwebtoken";

import { User } from "../entities/userEntity.js";
import { ENV } from "../config/env.js";
import { UserRepository } from "../repository/userRepository.js";

interface TokenPayload {
  id: string;
  email: string;
  isVerified: boolean;
}

 class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  generateToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      // expiresIn: "7d",
    });
  }

  generateRefreshToken(user: User): string {
    const payload: { id: string } = {
      id: user.id,
    };

    return jwt.sign(payload, ENV.REFRESH_JWT_SECRET, {
      // expiresIn: "30d",
    });
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
      const user = await this.userRepository.findById(decoded.id);
      return user;
    } catch (error) {
      return null;
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string } | null> {
    try {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_JWT_SECRET) as {
        id: string;
      };
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        return null;
      }

      const accessToken = this.generateToken(user);
      return { accessToken };
    } catch (error) {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.userRepository.create(userData);
  }
}

export default new AuthService();
