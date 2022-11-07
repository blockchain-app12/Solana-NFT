import {PINATA_JWT} from "../data/dataConstant.js"
import axios from "axios";

 export async function getMetaLink(imageFile) {

      if(imageFile === undefined){
        console.log("invalid Image");
        return;
      }

      const config = {
        method: 'POST',
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        headers: { 
          'Authorization':`Bearer ${PINATA_JWT}`,
        // ...data.getHeaders()
        },
        // headers: header,
        data : imageFile
      };
      
      const res = await axios(config);

      const imageUrl = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
      console.log("image url::: ",imageUrl);


      const metadata = {
        name: "sample NFT",
        symbol: "SAMPLE",
        description: "For mainnet testing",
        seller_fee_basis_points: 500,
        external_url: "none",
        attributes: [
            {
            trait_type: "NFT type",
            value: "Custom",
            },
        ],
        properties: {
            files: [
            {
                uri: imageUrl,
                type: "image/png",
            },
            ],
            category: "image",
            maxSupply: 0,
            creators: [
            {
                address: "Hn9wUVSGFGWffAvEJUntYB5d7nzaVjUX6SRnxxGqj2hL",
                share: 100,
            },
            ],        
        },
        collection:{
          family: "new_Collection_sample",
          name: "New Collection Sample"
        },
        image: imageUrl,
      };

      const MetaDataJson = JSON.stringify(metadata);

      var metadataConfig = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization':`Bearer ${PINATA_JWT}`, 
        // ...data.getHeaders()
        },
        data : MetaDataJson
      };    
      const metadataRes = await axios(metadataConfig);
      //console.log("metadataRes", metadataRes.data);

      const metadataURL = `https://gateway.pinata.cloud/ipfs/${metadataRes.data.IpfsHash}`;
      console.log("Meta URL", metadataURL);

      return metadataURL;

    }
