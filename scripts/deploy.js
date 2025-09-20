import { artifacts } from "hardhat";
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL  = process.env.RPC_URL ?? "";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "0");
const PKRAW    = process.env.PRIVATE_KEY ?? "";
if (!RPC_URL || !CHAIN_ID || !PKRAW) throw new Error("Missing RPC_URL/CHAIN_ID/PRIVATE_KEY");

const PK = PKRAW.startsWith("0x") ? PKRAW : `0x${PKRAW}`;

const chain = {
  id: CHAIN_ID,
  name: `didlab-${CHAIN_ID}`,
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
};

async function main() { const { abi, bytecode } = await artifacts.readArtifact("CampusCredit");

  const account = privateKeyToAccount(PK);
  const wallet  = createWalletClient({ account, chain, transport: http(RPC_URL) });
  const pc      = createPublicClient({ chain, transport: http(RPC_URL) });

  // IMPORTANT: use number 18 (not 18n)
  const initial = parseUnits("1000000", 18);
  const hash = await wallet.deployContract({ abi, bytecode, args: [initial] });
  console.log("Deploy tx:", hash);

  const r = await pc.waitForTransactionReceipt({ hash });
  console.log("CampusCredit deployed at:", r.contractAddress);
  console.log("Deployer:", account.address);
}
main().catch(e => { console.error(e); process.exit(1); });
