import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class TokenEncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key: Buffer;

  constructor() {
    const keyEnv = process.env.ENCRYPTION_KEY;
    if (!keyEnv) {
      // Fallback key for development if env is not defined
      this.key = crypto.scryptSync("dev-orbit-secret-salt-key-string", "salt", 32);
    } else {
      try {
        this.key = Buffer.from(keyEnv, "hex");
        if (this.key.length !== 32) {
          throw new Error("Key must be exactly 32 bytes (64 hex characters)");
        }
      } catch (err) {
        throw new Error(`Invalid ENCRYPTION_KEY environment variable: ${(err as Error).message}`);
      }
    }
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
    } catch (err) {
      throw new InternalServerErrorException(`Token encryption failed: ${(err as Error).message}`);
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
    } catch (err) {
      throw new InternalServerErrorException(`Token decryption failed: ${(err as Error).message}`);
    }
  }
}
