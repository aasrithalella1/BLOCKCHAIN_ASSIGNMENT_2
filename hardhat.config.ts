import type { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";

const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID || "0");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    didlab: {
      url: RPC_URL,
      chainId: CHAIN_ID,
      type: "http",         // remote DIDLab node
    },
    hardhat: {
      type: "edr-simulated" // local in-memory Hardhat network
    },
  },
};

export default config;
