import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AddUser } from 'src/user/dto';
import { AuthResponse, LoginUser, TokenVerificationResult, VerifyToken } from './web/dto';
import { User } from 'src/user/entity';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { Md5 } from 'ts-md5';
import { AuthenticationException, NotFoundException, ValidationException } from 'src/user/utils/exception';

const SECRET_KEY = 'THIS_KEY_IS_VERY_VERY_SECRET';
const TWVENTY_MINUTES_EXPIRATION_IN_SECONDS = 1200;
const ISSUER = 'NEST_AUTHENTICATION_SERVICE';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  public registerUser(newUser: AddUser): AuthResponse {
    const user: User = this.userService.addNewUser(newUser);
    const token = this.generateJwtTokenForUser(user);
    return { token };
  }

  public loginUser(loginUser: LoginUser): AuthResponse {
    const user = this.userService.findUserWithEmail(loginUser.email);
    if (user) {
      const hashedPassword = new Md5().appendAsciiStr(loginUser.password).end(false) as string;
      if (hashedPassword === user.passwordHash) {
        const token = this.generateJwtTokenForUser(user);
        return { token };
      } else {
        throw new ValidationException(`Email or password is not correct`);
      }
    } else {
      throw new NotFoundException(`User with email: ${loginUser.email} not found`);
    }
  }

  public verifyToken(tokenWrapper: VerifyToken): TokenVerificationResult {
    try {
      const decodedData: JwtPayload = verify(tokenWrapper.token, SECRET_KEY) as JwtPayload & { context: any };
      if (decodedData) {
        const now = this.currenUnixTimestampInSeconds();
        const expired: boolean = decodedData.exp < now;
        const iss = decodedData.iss !== ISSUER;
        if (expired || iss) {
          throw new AuthenticationException(`Specified authorization token invalid`);
        }
        return { verified: true, id: decodedData.context.id, email: decodedData.context.email, iss: decodedData.iss, sub: decodedData.sub, iat: decodedData.iat, exp: decodedData.exp };
      }
    } catch (e: any) {
      Logger.warn(e);
      throw new AuthenticationException(`Specified authorization token invalid`);
    }
  }

  private generateJwtTokenForUser(user: User): string {
    const now = this.currenUnixTimestampInSeconds();
    const expirationUnixSeconds = now + TWVENTY_MINUTES_EXPIRATION_IN_SECONDS;
    const token = sign({ context: { id: user.id, email: user.email }, iss: ISSUER, sub: user.email, iat: now, exp: expirationUnixSeconds }, SECRET_KEY);
    return token;
  }

  private currenUnixTimestampInSeconds() {
    return Math.floor(Date.now() / 1000);
  }
}
