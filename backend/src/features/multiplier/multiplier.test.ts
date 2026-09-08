import { describe, it, expect } from "vitest";
import { MultiplierGenerator } from "./generator.js";
import crypto from "crypto";

const SERVER_SEED = "server_seed_test";
const CLIENT_SEED = "client_seed_test";

describe("MultiplierGenerator", () => {
  describe("generateServerSeed", () => {
    it("should return an object with serverSeed and serverSeedHash", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      expect(Object.keys(serverSeedPair)).toEqual([
        "serverSeed",
        "serverSeedHash",
      ]);
    });

    it("should return serverSeed and serverSeedHash as strings", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      expect(serverSeedPair.serverSeed).toBeTypeOf("string");
      expect(serverSeedPair.serverSeedHash).toBeTypeOf("string");
    });

    it("should return a serverSeed containing only valid base64url characters", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      expect(serverSeedPair.serverSeed).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should return a serverSeed that decodes to 24 bytes", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      const decoded = Buffer.from(serverSeedPair.serverSeed, "base64url");
      expect(decoded).toHaveLength(24);
    });

    it("should not produce any duplicate serverSeed across many calls", () => {
      const seeds = new Set();
      for (let i = 0; i < 1000; i++) {
        seeds.add(MultiplierGenerator.generateServerSeed().serverSeed);
      }
      expect(seeds.size).toBe(1000);
    });

    it("should return a serverSeedHash that is 64 characters long", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      expect(serverSeedPair.serverSeedHash).toHaveLength(64);
    });

    it("should return a serverSeedHash containing only valid hex characters", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      expect(serverSeedPair.serverSeedHash).toMatch(/^[a-f0-9]+$/);
    });

    it("should return a serverSeedHash that matches sha256 of the returned serverSeed", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      const expectedHash = crypto
        .createHash("sha256")
        .update(serverSeedPair.serverSeed)
        .digest("hex");
      expect(serverSeedPair.serverSeedHash).toBe(expectedHash);
    });

    it("should produce a different serverSeedHash on every call", () => {
      const serverSeedPair = MultiplierGenerator.generateServerSeed();
      const serverSeedPair_1 = MultiplierGenerator.generateServerSeed();
      expect(serverSeedPair.serverSeedHash).not.toBe(
        serverSeedPair_1.serverSeedHash,
      );
    });
  });

  describe("generateMultiplier", () => {
    it("should throw if serverSeed is an empty string", () => {
      const func = () =>
        MultiplierGenerator.generateMultiplier("", CLIENT_SEED);
      expect(func).toThrow();
    });

    it("should throw if serverSeed is only whitespace", () => {
      const func = () =>
        MultiplierGenerator.generateMultiplier("  ", CLIENT_SEED);
      expect(func).toThrow();
    });

    it("should throw if clientSeed is an empty string", () => {
      const func = () =>
        MultiplierGenerator.generateMultiplier(SERVER_SEED, "");
      expect(func).toThrow();
    });

    it("should throw if clientSeed is only whitespace", () => {
      const func = () =>
        MultiplierGenerator.generateMultiplier(SERVER_SEED, "  ");
      expect(func).toThrow();
    });

    it("should return an object with serverSeed, clientSeed, roundHash and multiplier", () => {
      const results = MultiplierGenerator.generateMultiplier(
        SERVER_SEED,
        CLIENT_SEED,
      );
      expect(Object.keys(results)).toEqual([
        "serverSeed",
        "clientSeed",
        "roundHash",
        "multiplier",
      ]);
    });

    it("should return serverSeed, clientSeed, roundHash and multiplier with the correct types", () => {
      const results = MultiplierGenerator.generateMultiplier(
        SERVER_SEED,
        CLIENT_SEED,
      );
      expect(results.serverSeed).toBeTypeOf("string");
      expect(results.clientSeed).toBeTypeOf("string");
      expect(results.roundHash).toBeTypeOf("string");
      expect(results.multiplier).toBeTypeOf("number");
    });

    it("should return a roundHash containing valid hex characters", () => {
      const results = MultiplierGenerator.generateMultiplier(
        SERVER_SEED,
        CLIENT_SEED,
      );
      expect(results.roundHash).toMatch(/^[a-f0-9]+$/);
    });

    it("should return a roundHash that is 64 characters long", () => {
      const results = MultiplierGenerator.generateMultiplier(
        SERVER_SEED,
        CLIENT_SEED,
      );
      expect(results.roundHash).toHaveLength(64);
    });

    it("should return a multiplier that is greater than or equal to 1", () => {
      for (let i = 0; i < 1000; i++) {
        const results = MultiplierGenerator.generateMultiplier(
          `${SERVER_SEED}_${i}`,
          `${CLIENT_SEED}_${i}`,
        );
        expect(results.multiplier).toBeGreaterThanOrEqual(1);
      }
    });

    it("should return multipliers that are finite", () => {
      for (let i = 0; i < 1000; i++) {
        const results = MultiplierGenerator.generateMultiplier(
          `${SERVER_SEED}_${i}`,
          `${CLIENT_SEED}_${i}`,
        );
        expect(Number.isFinite(results.multiplier)).toBe(true);
      }
    });

    it("should return the same roundHash and multiplier for the same inputs", () => {
      const resultOne = MultiplierGenerator.generateMultiplier(
        SERVER_SEED,
        CLIENT_SEED,
      );
      const resultTwo = MultiplierGenerator.generateMultiplier(
        SERVER_SEED,
        CLIENT_SEED,
      );
      expect(resultOne.roundHash).toBe(resultTwo.roundHash);
      expect(resultOne.multiplier).toBe(resultTwo.multiplier);
    });

    it("should return a different roundHash when clientSeed changes", () => {
      const roundHashes = new Set();
      for (let i = 0; i < 1000; i++) {
        const result = MultiplierGenerator.generateMultiplier(
          SERVER_SEED,
          `${CLIENT_SEED}_${i}`,
        );
        roundHashes.add(result.roundHash);
      }
      expect(roundHashes.size).toBe(1000);
    });

    it("should return a different roundHash when serverSeed changes", () => {
      const roundHashes = new Set();
      for (let i = 0; i < 1000; i++) {
        const result = MultiplierGenerator.generateMultiplier(
          `${SERVER_SEED}_${i}`,
          CLIENT_SEED,
        );
        roundHashes.add(result.roundHash);
      }
      expect(roundHashes.size).toBe(1000);
    });
  });
});
