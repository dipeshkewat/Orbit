import { test, expect, describe } from "vitest";
import { TokenEncryptionService } from "./token-encryption.service";

describe("TokenEncryptionService", () => {
  const service = new TokenEncryptionService();

  test("should encrypt and decrypt correctly", () => {
    const plain = "gho_mySecretOAuthToken123456";
    const encrypted = service.encrypt(plain);
    
    expect(encrypted).toBeInstanceOf(Buffer);
    expect(encrypted.length).toBeGreaterThan(28);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plain);
  });

  test("should fail decryption on tampered buffer", () => {
    const plain = "anotherSecretToken";
    const encrypted = service.encrypt(plain);
    
    // Tamper the ciphertext slightly
    encrypted[encrypted.length - 1] ^= 1;

    expect(() => service.decrypt(encrypted)).toThrow();
  });
});
