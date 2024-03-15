import assert from "assert";
import BigNumber from "bignumber.js";

import { AnchorProvider, utils, Wallet } from "@project-serum/anchor";
import { Cluster, clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";

export const TEN_BIGNUM = BigNumber(10);

export const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export function getConnection(cluster: Cluster) {
	if (cluster === "mainnet-beta") {
		const RPC_URL = process.env.RPC_URL;
		assert(RPC_URL && RPC_URL != "", "missing env var RPC_URL");
		return new Connection(RPC_URL);
	} else {
		return new Connection(clusterApiUrl(cluster));
	}
}

export function getProvider(connection: Connection): [AnchorProvider, Keypair] {
	const SECRET_KEY = process.env.SECRET_KEY;
	// console.log(SECRET_KEY);
	assert(SECRET_KEY && SECRET_KEY !== "", "misssing env var SECRET key");

	const keypair = Keypair.fromSecretKey(utils.bytes.bs58.decode(SECRET_KEY));

	return [
		new AnchorProvider(connection, new Wallet(keypair), AnchorProvider.defaultOptions()),
		keypair,
	];
}

export async function getMintDecimals(connection: Connection, mint: PublicKey) {
	const info = await connection.getTokenSupply(mint);
	return info.value.decimals;
}
