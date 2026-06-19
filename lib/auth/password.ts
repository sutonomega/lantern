import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const algorithm = "pbkdf2_sha256";
const iterations = 210_000;
const keyLength = 32;
const digest = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("base64url");

  return `${algorithm}$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [storedAlgorithm, storedIterations, salt, hash] = storedHash.split("$");

  if (storedAlgorithm !== algorithm || !storedIterations || !salt || !hash) {
    return false;
  }

  const computedHash = pbkdf2Sync(
    password,
    salt,
    Number(storedIterations),
    keyLength,
    digest
  );
  const expectedHash = Buffer.from(hash, "base64url");

  return expectedHash.length === computedHash.length && timingSafeEqual(expectedHash, computedHash);
}
