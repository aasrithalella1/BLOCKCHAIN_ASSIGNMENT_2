import { artifacts } from "hardhat";
import { createWalletClient, createPublicClient, http, parseUnits, formatUnits, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const { RPC_URL, CHAIN_ID, PRIVATE_KEY, TOKEN, ACCT2 } = process.env;
const chainId = Number(CHAIN_ID);
const pk = PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
const DEC = 18;

async function main() {
  if (!TOKEN) throw new Error("Set TOKEN env var to your deployed token address");
  const { abi } = await artifacts.readArtifact("CampusCredit");
  const chain = { id: chainId, name:`didlab-${chainId}`, nativeCurrency:{name:"ETH",symbol:"ETH",decimals:18}, rpcUrls:{default:{http:[RPC_URL]}} };

  const account = privateKeyToAccount(pk);
  const wallet = createWalletClient({ account, chain, transport: http(RPC_URL) });
  const pc = createPublicClient({ chain, transport: http(RPC_URL) });
  const to = (ACCT2 || account.address).trim();

  const bal = async (tag) => {
    const b1 = await pc.readContract({ address:getAddress(TOKEN), abi, functionName:"balanceOf", args:[account.address] });
    const b2 = await pc.readContract({ address:getAddress(TOKEN), abi, functionName:"balanceOf", args:[to] });
    console.log(`${tag} | Deployer: ${formatUnits(b1, DEC)} CAMP | Acct2: ${formatUnits(b2, DEC)} CAMP`);
  };

  await bal("Before");

  const tx1 = await wallet.writeContract({ address:getAddress(TOKEN), abi, functionName:"transfer",
    args:[to, parseUnits("100", DEC)], maxPriorityFeePerGas:1_000_000_000n, maxFeePerGas:20_000_000_000n });
  console.log("Tx1:", tx1);
  await pc.waitForTransactionReceipt({ hash: tx1 });

  const tx2 = await wallet.writeContract({ address:getAddress(TOKEN), abi, functionName:"transfer",
    args:[to, parseUnits("50", DEC)], maxPriorityFeePerGas:3_000_000_000n, maxFeePerGas:22_000_000_000n });
  console.log("Tx2:", tx2);
  await pc.waitForTransactionReceipt({ hash: tx2 });

  const tx3 = await wallet.writeContract({ address:getAddress(TOKEN), abi, functionName:"approve",
    args:[to, parseUnits("25", DEC)], maxPriorityFeePerGas:2_000_000_000n, maxFeePerGas:21_000_000_000n });
  console.log("Tx3:", tx3);
  await pc.waitForTransactionReceipt({ hash: tx3 });

  await bal("After");
  console.log("HASHES:", JSON.stringify({ tx1, tx2, tx3 }, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
