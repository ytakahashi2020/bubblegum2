const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { keypairIdentity, none } = require('@metaplex-foundation/umi');
const { mintV2, parseLeafFromMintV2Transaction } = require('@metaplex-foundation/mpl-bubblegum');
const { fromWeb3JsKeypair } = require('@metaplex-foundation/umi-web3js-adapters');
const { Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');

async function mintCompressedNFT(merkleTreeAddress) {
  const umi = createUmi('https://api.devnet.solana.com');

  // Load wallet from ~/.config/solana/id.json
  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  umi.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

  // Mint compressed NFT
  const { signature } = await mintV2(umi, {
    leafOwner: umi.identity.publicKey,
    merkleTree: merkleTreeAddress,
    metadata: {
      name: 'My Compressed NFT',
      uri: 'https://example.com/my-nft.json',
      collection: none(),
      creators: [],
    },
  }).sendAndConfirm(umi);

  // Parse the leaf from the transaction
  const leaf = await parseLeafFromMintV2Transaction(umi, signature);

  console.log('Compressed NFT minted successfully!');
  console.log('Transaction signature:', signature);
  console.log('Asset ID:', leaf.id);
}

// Get merkle tree address from command line argument
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide the merkle tree address as an argument');
  console.error('Usage: node mintCNFT.js <merkle-tree-address>');
  process.exit(1);
}

mintCompressedNFT(args[0]).catch(console.error);