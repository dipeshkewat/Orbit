import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class TokenEncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key: Buffer;

  constructor() {
    const keyEnv = process.env.ENCRYPTION_KEY;
    if (!keyEnv) {
      if (process.env.NODE_ENV === "test") {
        this.key = crypto.scryptSync("orbit-test-encryption-key", "test-salt", 32);
        return;
      }
      throw new Error("ENCRYPTION_KEY is required outside test environments");
    }

    if (!/^[0-9a-fA-F]{64}$/.test(keyEnv)) {
      throw new Error("ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
    }
    this.key = Buffer.from(keyEnv, "hex");
  }

  /**
   * Encrypt plaintext string into a Buffer containing IV (12 bytes), Tag (16 bytes), and ciphertext.
   */
  encrypt(plaintext: string): Buffer {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(plaintext, "utf8");
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();
      
      // Concat IV + Tag + Encrypted data
      return Buffer.concat([iv, tag, encrypted]);
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Token encryption failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  /**
   * Decrypt buffer packed with IV + Tag + Ciphertext back to plaintext string.
   */
  decrypt(ciphertextBuffer: Buffer): string {
    try {
      if (ciphertextBuffer.length < 28) {
        throw new Error("Invalid ciphertext buffer length");
      }
      
      const iv = ciphertextBuffer.subarray(0, 12);
      const tag = ciphertextBuffer.subarray(12, 28);
      const encryptedData = ciphertextBuffer.subarray(28);
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString("utf8");
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Token decryption failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }
}
