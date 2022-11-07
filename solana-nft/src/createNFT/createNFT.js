import { useEffect, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import FormData from 'form-data';
import { getMetaLink } from "./createMetaLink";
import {getMetadataPDA , getMasterEditionPDA} from "./getPDA"
import { Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV2Instruction,
  createCreateMasterEditionV3Instruction,
  createVerifyCollectionInstruction
} from "@metaplex-foundation/mpl-token-metadata";
import { ADMIN_PK } from "../data/dataConstant";
import bs58 from 'bs58';

const CreateNFT = () => {

  const [bufferImage, setBufferImage ] = useState();
  const [details , setDetails] = useState([{name:'', symbol:'', description:''}]);
  const [imageFile, setImageFile] = useState();
  const [mintLink, setMintLink] = useState();
  const [balance, setBalance] = useState();
  const {connection} = useConnection();
  const wallet = useWallet();
  const collectionAddress = new PublicKey("BvvMZAjp3N9HqAguSsq4e7aDCZ3eBHnEnj41yEd6kbw1");

  useEffect(() => {
    const provider = new anchor.AnchorProvider(connection, wallet);
    anchor.setProvider(provider);

    if(wallet !== null){
      console.log(String(wallet.publicKey));
      return;
    }

  }, [connection, wallet]);

  const admin = Keypair.fromSecretKey(bs58.decode(ADMIN_PK));

  (async () => {
    setBalance(await connection.getBalance(admin.publicKey));
  })();
  

  const handleInputs = (e ) => {
		const {name, value} = e.target;
		details[name] = value;
		setDetails(details);

    console.log(details);
	}

  const onchangeHandler = async(event) => {
    
      setBufferImage(URL.createObjectURL(event.target.files[0]));

    const imgData = new FormData();
    imgData.append('file', event.target.files[0]);
    setImageFile(imgData);
  }

  const generateNFT = async() => {
    console.log("run");
    const metaLink = await getMetaLink(imageFile);
    createToken(metaLink);
  };

  const createToken = async(metadatalink) => {

    if(details.name == null || details.symbol == null || wallet == null){
      console.log("invalid name or symbol");
      return;
    }

    let mint = Keypair.generate();
    console.log(`mint: ${mint.publicKey.toBase58()}`);
    
    const ata = await getAssociatedTokenAddress(mint.publicKey, wallet.publicKey);
    const tokenMetadataPubkey = await getMetadataPDA(mint.publicKey);
    const masterEditionPubkey = await getMasterEditionPDA(mint.publicKey);
  
    
    const collectionPDA = await getMetadataPDA(collectionAddress);
    const collectionMasterEdition = await getMasterEditionPDA(collectionAddress)

    console.log("log produced");

    var transaction = new Transaction().add(
      SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: admin.publicKey,
          lamports: LAMPORTS_PER_SOL/10,
      })
    );
    // Sign transaction, broadcast, and confirm
    var signature = await wallet.sendTransaction(
        transaction,
        connection,
    );

    await connection.confirmTransaction(signature,"confirmed");
    console.log("SIGNATURE", signature);
  
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: admin.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: await getMinimumBalanceForRentExemptMint(connection),
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mint.publicKey, 0, admin.publicKey, admin.publicKey),
      createAssociatedTokenAccountInstruction(admin.publicKey, ata, wallet.publicKey, mint.publicKey), // create associated token address
      createMintToCheckedInstruction(mint.publicKey, ata, admin.publicKey, 1, 0),
      createCreateMetadataAccountV2Instruction(  // create NFT token
        {
          metadata: tokenMetadataPubkey,
          mint: mint.publicKey,
          mintAuthority: admin.publicKey,
          payer: admin.publicKey,
          updateAuthority: admin.publicKey,
        },
        {
          createMetadataAccountArgsV2: {
            data: {
              name: String(details.name),
              symbol: String(details.symbol),
              uri: String(metadatalink),
              sellerFeeBasisPoints: 500,
              creators: [
                {
                  address: admin.publicKey,
                  verified: true,
                  share: 100,
                },
              ],
              collection: {
                key: collectionAddress,
                verified: false
              },
              // collection: null,
              uses: null,
            },
            isMutable: true,
          },
        }
      ),  //      -------------------- create master edition -----------------------
      createCreateMasterEditionV3Instruction(
        {
          edition: masterEditionPubkey,
          mint: mint.publicKey,
          updateAuthority: admin.publicKey,
          mintAuthority: admin.publicKey,
          payer: admin.publicKey,
          metadata: tokenMetadataPubkey,
        },
        {
          createMasterEditionArgs: {
            maxSupply: 0,
          },
        }
      ),   //   ----------------------- verifyCollection -----------------------
      createVerifyCollectionInstruction(
          {
              metadata: tokenMetadataPubkey,
              collectionAuthority: admin.publicKey,
              payer: admin.publicKey,
              collectionMint: collectionAddress,
              collection: collectionPDA,
              collectionMasterEditionAccount: collectionMasterEdition,
          }
      )
    );

    console.log("transaction call");

    try {
      const signature = await connection.sendTransaction(tx, [admin, mint]);
      await connection.confirmTransaction(signature, "confirmed");
      console.log("txHash: ", signature);
      console.log(`https://solscan.io/token/${String(mint.publicKey)}?cluster=devnet`);
      setMintLink(`https://solscan.io/token/${String(mint.publicKey)}?cluster=devnet`);
    } catch(e) {
      console.log("error: ",e);
      return null;
    }
  
  }

  return( 
    <div>

      <label>
        <p>AdminWallet: {String(admin.publicKey)}</p>
        <p>balance: {balance / 1e9} </p>
      </label>

        {mintLink != null ? (<div>
          <a href={mintLink} target="_blank">{mintLink}</a>
          </div>) : 
          (<div> </div>) }      
      
      <div>
        <h4>Name:</h4>
        <input name="name" type="text"  onChange={e=>handleInputs(e)} />
        <h4>symbol:</h4>
        <input name="symbol" type="text"  onChange={e=>handleInputs(e)} />
      </div>
      <div>
        <h4>select image :</h4>
        <input type="file"  onChange={onchangeHandler} />
        <img src={bufferImage} />
      </div>
      <br />
      <button className="button" onClick={generateNFT}> Buy NFT </button>
    </div>
  );

}

export default CreateNFT;