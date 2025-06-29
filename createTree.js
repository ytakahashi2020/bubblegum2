import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import {
  createTreeV2,
  fetchTreeConfigFromSeeds,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  fetchMerkleTree,
} from "@metaplex-foundation/mpl-account-compression";
import {
  fromWeb3JsKeypair,
} from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import os from "os";

async function createBubblegumTree() {
  const umi = createUmi("https://api.devnet.solana.com");

  // Load wallet from ~/.config/solana/id.json
  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  umi.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

  const merkleTree = generateSigner(umi);

  const builder = await createTreeV2(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });

  await builder.sendAndConfirm(umi);

  console.log("Tree created successfully!");
  console.log("Merkle Tree Address:", merkleTree.publicKey);

  // Fetch Merkle Tree account
  const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree.publicKey);
  console.log("\nMerkle Tree Account Info:");
  // console.log('Full account structure:', JSON.stringify(merkleTreeAccount, (key, value) =>
  //   typeof value === 'bigint' ? value.toString() : value, 2));

  // Try to access available properties
  if (merkleTreeAccount.tree) {
    console.log("\nTree Details:");
    console.log("Sequence Number:", merkleTreeAccount.tree.sequenceNumber);
    console.log("Active Index:", merkleTreeAccount.tree.activeIndex);
    console.log("Buffer Size:", merkleTreeAccount.tree.bufferSize);
  }

  // Fetch Tree Config account
  const treeConfig = await fetchTreeConfigFromSeeds(umi, {
    merkleTree: merkleTree.publicKey,
  });
  console.log("\nTree Config Info:");
  console.log("Tree Creator:", treeConfig.treeCreator);
  console.log("Tree Delegate:", treeConfig.treeDelegate);
  console.log("Total Capacity:", treeConfig.totalCapacity);
  console.log("Number Minted:", treeConfig.numMinted);
  console.log("Is Public:", treeConfig.isPublic);
  console.log("Is Decompressible:", treeConfig.isDecompressible);
  console.log("Version:", treeConfig.version);
}

createBubblegumTree().catch(console.error);
