import { artifacts } from "hardhat";
import { createPublicClient, http, decodeEventLog } from "viem";

const { RPC_URL, CHAIN_ID, TX1, TX2, TX3 } = process.env;
const chainId = Number(CHAIN_ID);

async function analyze(hash) {
  const pc = createPublicClient({
    chain: { id: chainId, name: `didlab-${chainId}`, nativeCurrency:{name:"ETH",symbol:"ETH",decimals:18}, rpcUrls:{ default:{ http:[RPC_URL] } } },
    transport: http(RPC_URL)
  });

  const tx   = await pc.getTransaction({ hash });
  const rcpt = await pc.getTransactionReceipt({ hash });
  const block = await pc.getBlock({ blockNumber: rcpt.blockNumber });

  const base  = block.baseFeePerGas ?? 0n;
  const eff   = rcpt.effectiveGasPrice ?? tx.gasPrice ?? 0n;
  const fee   = (rcpt.gasUsed ?? 0n) * eff;

  console.log(`\n=== ${hash} ===`);
  console.log("Status:", rcpt.status, "Block:", rcpt.blockNumber, "UTC:", new Date(Number(block.timestamp)*1000).toISOString());
  console.log("From:", tx.from, "To:", tx.to, "Nonce:", tx.nonce);
  console.log("Gas limit:", tx.gas, "Gas used:", rcpt.gasUsed);
  console.log("Base:", base, "Max:", tx.maxFeePerGas ?? 0n, "Priority:", tx.maxPriorityFeePerGas ?? 0n, "Effective:", eff);
  console.log("Total fee (wei):", fee);

  const { abi } = await artifacts.readArtifact("CampusCredit");
  for (const log of rcpt.logs) {
    try {
      const p = decodeEventLog({ abi, data: log.data, topics: log.topics });
      console.log("Event:", p.eventName, p.args);
    } catch {}
  }
}

(async () => {
  if (!TX1 || !TX2 || !TX3) throw new Error("Set TX1, TX2, TX3 env vars");
  await analyze(TX1); await analyze(TX2); await analyze(TX3);
})().catch(e => { console.error(e); process.exit(1); });
