const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { keypairIdentity } = require('@metaplex-foundation/umi');
const { dasApi } = require('@metaplex-foundation/digital-asset-standard-api');
const { fromWeb3JsKeypair } = require('@metaplex-foundation/umi-web3js-adapters');
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');

async function fetchCompressedNFT(assetId) {
  // Use Helius RPC which supports DAS API
  const umi = createUmi('https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY');
  umi.use(dasApi());

  // Load wallet from ~/.config/solana/id.json
  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  umi.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

  try {
    // Fetch single asset
    console.log('Fetching asset:', assetId);
    const asset = await umi.rpc.getAsset(assetId);
    console.log('\nAsset Details:');
    console.log('ID:', asset.id);
    console.log('Owner:', asset.ownership.owner);
    console.log('Name:', asset.content.metadata.name);
    console.log('Symbol:', asset.content.metadata.symbol);
    console.log('URI:', asset.content.json_uri);
    console.log('Creators:', asset.creators);
    console.log('Royalty:', asset.royalty);
    
    // Fetch asset proof
    const assetProof = await umi.rpc.getAssetProof(assetId);
    console.log('\nAsset Proof:');
    console.log('Tree ID:', assetProof.tree_id);
    console.log('Leaf:', assetProof.leaf);
    console.log('Node Index:', assetProof.node_index);
    console.log('Proof length:', assetProof.proof.length);
    
    // Fetch all assets by owner
    console.log('\n\nFetching all assets owned by:', umi.identity.publicKey);
    const assetsByOwner = await umi.rpc.getAssetsByOwner({
      owner: umi.identity.publicKey,
    });
    console.log('Total assets owned:', assetsByOwner.items.length);
    assetsByOwner.items.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.content.metadata.name} (${asset.id})`);
    });
    
  } catch (error) {
    console.error('Error fetching asset:', error.message);
    console.log('\nNote: This requires an RPC endpoint that supports the DAS API.');
    console.log('Please replace YOUR_API_KEY with a valid Helius API key or use another DAS-enabled RPC.');
  }
}

// Get asset ID from command line argument
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide the asset ID as an argument');
  console.error('Usage: node fetchCNFT.js <asset-id>');
  process.exit(1);
}

fetchCompressedNFT(args[0]).catch(console.error);