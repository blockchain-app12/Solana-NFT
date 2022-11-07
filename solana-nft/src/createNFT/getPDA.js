import { PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {  PublicKey } from "@solana/web3.js";


export async function getMetadataPDA(mint) {
    const [publicKey] = await PublicKey.findProgramAddress(
      [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );
    return publicKey;
}

export async function getMasterEditionPDA(mint) {
    const [publicKey] = await PublicKey.findProgramAddress(
      [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );
    return publicKey;
}