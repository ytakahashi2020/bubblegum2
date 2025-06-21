const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { generateSigner, keypairIdentity } = require('@metaplex-foundation/umi');
const { createTree } = require('@metaplex-foundation/mpl-bubblegum');
const { fromWeb3JsKeypair } = require('@metaplex-foundation/umi-web3js-adapters');
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');

async function createBubblegumTree() {
  const umi = createUmi('https://api.devnet.solana.com');

  // Load wallet from ~/.config/solana/id.json
  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  umi.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

  const merkleTree = generateSigner(umi);

  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });

  await builder.sendAndConfirm(umi);

  console.log('Tree created successfully!');
  console.log('Merkle Tree Address:', merkleTree.publicKey);
}

createBubblegumTree().catch(console.error);