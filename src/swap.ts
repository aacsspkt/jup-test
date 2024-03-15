import BigNumber from "bignumber.js";
import fetch from "cross-fetch";

import { createTransferInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
	AddressLookupTableAccount,
	Connection,
	Keypair,
	PublicKey,
	TransactionMessage,
	VersionedTransaction,
} from "@solana/web3.js";

import { USDC_MINT } from "./utils";

export async function swapAndTransferUsdc(
	connection: Connection,
	sourceKeypair: Keypair,
	destination: PublicKey,
	inputMint: PublicKey,
	inputAmount: string,
	slippage: string,
) {
	const amount = BigNumber(inputAmount);
	const ONE_UNTIS = 1000000;
	const parsedAmount = amount.times(ONE_UNTIS);

	const quoteResponse = await (
		await fetch(
			`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${USDC_MINT.toString()}&amount=${parsedAmount.toFixed()}&slippageBps=${slippage}&swapMode=ExactOut`,
		)
	).json();
	console.log("quoteResponse:", JSON.stringify(quoteResponse));

	// get serialized transactions for the swap
	const { swapTransaction } = await (
		await fetch("https://quote-api.jup.ag/v6/swap", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				// quoteResponse from /quote api
				quoteResponse,
				// user public key to be used for the swap
				userPublicKey: sourceKeypair.publicKey.toString(),
				// auto wrap and unwrap SOL. default is true
				wrapAndUnwrapSol: true,
				// feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
				// feeAccount: "fee_account_public_key"
			}),
		})
	).json();

	// deserialize the transaction
	const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
	let transaction = VersionedTransaction.deserialize(swapTransactionBuf);
	// console.log("transaction:", transaction);

	// get address lookup table accounts
	const addressLookupTableAccounts = await Promise.all(
		transaction.message.addressTableLookups.map(async (lookup) => {
			const data = await connection.getAccountInfo(lookup.accountKey).then((res) => res!.data);
			return new AddressLookupTableAccount({
				key: lookup.accountKey,
				state: AddressLookupTableAccount.deserialize(data),
			});
		}),
	);
	// console.log("addressLookupTableAccounts:", addressLookupTableAccounts);

	// decompile transaction message and add transfer instruction
	let message = TransactionMessage.decompile(transaction.message, {
		addressLookupTableAccounts: addressLookupTableAccounts,
	});

	// construct the transfer instruction
	const sourceUSDCAccount = getAssociatedTokenAddressSync(USDC_MINT, sourceKeypair.publicKey);
	const destinationUSDCAccount = getAssociatedTokenAddressSync(USDC_MINT, destination);
	const transferInstruction = createTransferInstruction(
		sourceUSDCAccount,
		destinationUSDCAccount,
		sourceKeypair.publicKey,
		BigInt(quoteResponse.outAmount),
	);

	message.instructions.push(transferInstruction);

	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
	message.recentBlockhash = blockhash;

	// compile the message and update the transaction
	transaction.message = message.compileToV0Message(addressLookupTableAccounts);

	// sign the transaction
	transaction.sign([sourceKeypair]);

	// Execute the transaction
	// const signature = await connection.sendRawTransaction(transaction.serialize());
	// console.log("signature:", signature);
	// await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "finalized");
	// console.log(`https://solscan.io/tx/${signature}`);
}
