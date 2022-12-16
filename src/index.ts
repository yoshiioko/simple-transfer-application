import * as Web3 from "@solana/web3.js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function initializeSender(
  connection: Web3.Connection
): Promise<Web3.Keypair> {
  if (!process.env.SENDER_PRIVATE_KEY) {
    console.log("Generating Sender Keypair... 🗝️");
    const keypair = Web3.Keypair.generate();

    console.log("Creating .env file");
    fs.writeFileSync(
      ".env",
      `SENDER_PRIVATE_KEY=[${keypair.secretKey.toString()}]\r\n`
    );

    await airdropSolIfNeeded(keypair, connection);

    return keypair;
  }

  const secret = JSON.parse(process.env.SENDER_PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const keypairFromSecret = Web3.Keypair.fromSecretKey(secretKey);

  await airdropSolIfNeeded(keypairFromSecret, connection);

  return keypairFromSecret;
}

async function initializeReceiver(
  connection: Web3.Connection
): Promise<Web3.Keypair> {
  if (!process.env.RECEIVER_PRIVATE_KEY) {
    console.log("Generating Receiver Keypair... 🗝️");
    const keypair = Web3.Keypair.generate();

    console.log("Creating .env file");
    fs.writeFileSync(
      ".env",
      `RECEIVER_PRIVATE_KEY=[${keypair.secretKey.toString()}]`,
      { flag: "a+" }
    );

    return keypair;
  }

  const secret = JSON.parse(process.env.RECEIVER_PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const keypairFromSecret = Web3.Keypair.fromSecretKey(secretKey);

  return keypairFromSecret;
}

async function airdropSolIfNeeded(
  signer: Web3.Keypair,
  connection: Web3.Connection
) {
  const balance = await connection.getBalance(signer.publicKey);
  if (balance / Web3.LAMPORTS_PER_SOL < 1) {
    console.log("Airdropping 1 SOL");

    const airDropSignature = await connection.requestAirdrop(
      signer.publicKey,
      Web3.LAMPORTS_PER_SOL
    );

    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: airDropSignature,
    });

    const newBalance = await connection.getBalance(signer.publicKey);
    console.log("New balance is", newBalance / Web3.LAMPORTS_PER_SOL, "SOL");
  }
}

async function simpleSolTransfer(
  connection: Web3.Connection,
  sender: Web3.Keypair,
  receiver: Web3.Keypair
) {
  console.log(
    "Attempting to transfer 0.1 SOL from",
    sender.publicKey.toBase58(),
    "to",
    receiver.publicKey.toBase58()
  );

  const transaction = new Web3.Transaction();
  const instruction = Web3.SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    lamports: Web3.LAMPORTS_PER_SOL * 0.1,
    toPubkey: receiver.publicKey,
  });

  transaction.add(instruction);
  const transactionSignature = await Web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [sender]
  );

  console.log(
    `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );
}

async function main() {
  const connection = new Web3.Connection(Web3.clusterApiUrl("devnet"));
  const sender = await initializeSender(connection);
  const receiver = await initializeReceiver(connection);

  console.log("Sender Public Key:", sender.publicKey.toBase58());
  console.log("Receiver Public Key:", receiver.publicKey.toBase58());

  await simpleSolTransfer(connection, sender, receiver);
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
