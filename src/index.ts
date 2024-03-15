import dotenv from "dotenv";

import { PublicKey } from "@solana/web3.js";

import { swapAndTransferUsdc } from "./swap";
import { getConnection, getProvider } from "./utils";

async function main() {
	dotenv.config();

	const connection = getConnection("mainnet-beta");
	const [, keypair] = getProvider(connection);
	const destination = new PublicKey("AGhJpgQvKzNDF8RZ7EW6sjJBm6FgKHZQyqsXGqYNLqR2");
	// const inputMint = new PublicKey("AZsHEMXd36Bj1EMNXhowJajpUXzrKcK57wW4ZGXVa7yR"); // GUAC
	const inputMint = new PublicKey("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"); // WIF
	// const inputMint = new PublicKey("zebeczgi5fSEtbpfQKVZKCJ3WgYXxjkMUkNNx7fLKAF"); // ZBC

	const inputAmount = "0.001";
	const slippage = "50"; // 0.5%

	await swapAndTransferUsdc(connection, keypair, destination, inputMint, inputAmount, slippage);

	// const provider = getZebecConnectionProvider(connection);
	// const program = ZebecCardProgramFactory.getProgram(provider);
	// const instructions = new ZebecCardInstructions(program);
	// const service = new ZebecCardService(instructions, connection);

	// const info = await service.getQuoteInfo({
	// 	inputAmount,
	// 	inputMintAddress: inputMint,
	// 	slippagePercent: slippage,
	// });

	// console.log("info:", info);
}

main();
