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

    return keypair;
  }

  const secret = JSON.parse(process.env.SENDER_PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const keypairFromSecret = Web3.Keypair.fromSecretKey(secretKey);

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

async function main() {
  const connection = new Web3.Connection(Web3.clusterApiUrl("devnet"));
  const sender = await initializeSender(connection);
  const receiver = await initializeReceiver(connection);

  console.log("Sender Public Key:", sender.publicKey.toBase58());
  console.log("Receiver Public Key:", receiver.publicKey.toBase58());
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
