import crypto from "crypto";

export interface ServerSeedPair {
  serverSeed: string;
  serverSeedHash: string;
}

export interface MultiplierResult {
  serverSeed: string;
  clientSeed: string;
  roundHash: string;
  multiplier: number;
}

export class MultiplierGenerator {
  // 13 hex chars = 52 bits, safely under Number.MAX_SAFE_INTEGER
  public static readonly HEX_SLICE_LEN = 13;

  public static generateServerSeed(): ServerSeedPair {
    const serverSeed = crypto.randomBytes(24).toString("base64url");

    const serverSeedHash = crypto
      .createHash("sha256")
      .update(serverSeed)
      .digest("hex");

    return { serverSeed, serverSeedHash };
  }

  public static generateMultiplier(
    serverSeed: string,
    clientSeed: string,
  ): MultiplierResult {
    if (!serverSeed.trim()) {
      throw new Error("Server seed cannot be an empty string");
    }

    if (!clientSeed.trim()) {
      throw new Error("Client seed cannot be an empty string");
    }

    const combinedSeeds = `${serverSeed}${clientSeed}`;

    const roundHash = crypto
      .createHash("sha256")
      .update(combinedSeeds)
      .digest("hex");

    const slicedHash = roundHash.slice(0, MultiplierGenerator.HEX_SLICE_LEN);
    const hashAsInteger = parseInt(slicedHash, 16);

    const numBits = slicedHash.length * 4;
    const maxHashValue = 2 ** numBits - 1;

    // Normalize in range 0..1
    let normalizedValue = hashAsInteger / maxHashValue;
    if (normalizedValue >= 1) {
      normalizedValue = normalizedValue - Number.EPSILON; // Avoid Infinity in the final multiplier
    }

    const multiplier = 1 / (1 - normalizedValue);

    return { serverSeed, clientSeed, roundHash, multiplier };
  }
}
