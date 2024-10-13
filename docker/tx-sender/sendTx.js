const { ethers } = require("ethers");

// Get the mnemonic from the environment variable
const seedPhrase = process.env.MNEMONIC;

// Initialize ethers with a Ganache provider
const provider = new ethers.providers.JsonRpcProvider(process.env.GANACHE_URL);

// Derive the 10th account from the seed phrase
const wallet = ethers.Wallet.fromMnemonic(seedPhrase, "m/44'/60'/0'/0/9");

// Connect the wallet to the provider
const signer = wallet.connect(provider);

// Store the next nonce
let nextNonce;

const checkChainReady = async () => {
  try {
    // Check the latest block to confirm the chain is running
    await provider.getBlockNumber();
    console.log("Chain is up and running!");
    return true;
  } catch (error) {
    console.log("Waiting for the chain to be up...");
    return false;
  }
};

const waitForChain = async () => {
  while (!(await checkChainReady())) {
    // Retry every 5 seconds until the chain is available
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

async function sendRandomTransaction() {
  try {
    // Use the stored next nonce or fetch it if it's the first transaction
    if (nextNonce === undefined) {
      nextNonce = await provider.getTransactionCount(signer.address, "latest");
    }

    const value = ethers.utils.parseEther("0.0001");

    // Define the transaction details, including the correct nonce
    const tx = {
      to: '0xffcf8fdee72ac11b5c542428b35eef5769c409f0', // receiver address
      value: value,
      gasLimit: ethers.utils.hexlify(21000), // fixed gas limit for basic tx
      nonce: nextNonce, // correct nonce for this transaction
    };

    // Send the transaction
    const txResponse = await signer.sendTransaction(tx);

    // Wait for transaction confirmation
    const receipt = await txResponse.wait();

    console.log(`Transaction confirmed! Hash: ${receipt.transactionHash}`);

    // Increment the next nonce after the transaction is confirmed
    nextNonce += 1;
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

(async () => {
  // Wait for the chain to be up
  await waitForChain();

  // Send a transaction every second once the chain is ready
  setInterval(sendRandomTransaction, 1000);
})();
