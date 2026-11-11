import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { UserRole } from "../models/User";

export interface AccessClaims {
  sub: string; // user id — the client decodes this to identify the user
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  name?: string;
  role: UserRole;
  email_verified?: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export function signTokens(user: {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}): TokenPair {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const claims: AccessClaims = {
    sub: user.id,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    given_name: user.firstName,
    family_name: user.lastName,
    preferred_username: user.phoneNumber,
    name: fullName || user.phoneNumber,
    role: user.role,
    email_verified: false,
  };

  const access_token = jwt.sign(claims, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  } as SignOptions);

  const refresh_token = jwt.sign({ sub: user.id, type: "refresh" }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  } as SignOptions);

  return { access_token, refresh_token };
}

export function verifyAccess(token: string): AccessClaims {
  return jwt.verify(token, env.jwt.accessSecret) as AccessClaims;
}

export function verifyRefresh(token: string): { sub: string } {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
}
