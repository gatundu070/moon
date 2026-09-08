import { MultiplierGenerator } from "./features/multiplier/generator.js";

const serverSeedPair = MultiplierGenerator.generateServerSeed();
const multiplierResults = MultiplierGenerator.generateMultiplier(
  serverSeedPair.serverSeed,
  "client_seed_001",
);
console.log(multiplierResults);
