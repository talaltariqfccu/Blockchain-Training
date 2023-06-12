import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import FormData from "form-data";
import { ethers } from "ethers";
import { contractAbi } from "../abi.js";

dotenv.config();

const pinataApiKey = process.env.API_KEY;
const pinataSecretApiKey = process.env.SECRET_API_KEY;
const endpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";

async function pinFileToPinata(filename) {
  try {
    const filePath = `uploads/${filename}`;
    const fileData = fs.readFileSync(filePath);

    const formData = new FormData();
    formData.append("file", fileData, {
      filename: `file-${Date.now()}.jpg`,
      contentType: "image/jpg",
    });

    const headers = {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    };

    // Make the pinning request using Axios
    const response = await axios.post(endpoint, formData, { headers });
    if (response) {
      console.log("Picture pinned successfully!");
      return response;
    }
  } catch (error) {
    console.error("Error pinning file:", error.message);
  }
}

async function uploadMetaDataToIPFS(data, filename) {
  try {
    const formData = new FormData();

    const jsonData = JSON.stringify(data);

    // console.log(data)
    formData.append("file", jsonData, {
      filename: `metadata-${filename.split(".")[0]}.json`,
    });

    // console.log(formData)

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        },
      }
    );
    // console.log(`Metadata pinned Successfully`,response.data)
    console.log(response);
    return response;
  } catch (err) {
    console.log("Errro in Uploading MetaData:", err);
  }
}

async function mintAnNft(metaDataHash) {
  try {
    const contractAddress = await process.env.CONTRACT_ADDRESS;
    const mumbaiRpc = await process.env.RPC;
    const privateKey = await process.env.WALLET_PRIVATE_CODE;

    const providor = new ethers.providers.JsonRpcProvider(mumbaiRpc);
    const wallet = new ethers.Wallet(privateKey, providor);

    const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

    
    const { IpfsHash } = metaDataHash;

    const response = await contract.mintNft(
      await wallet.getAddress(),
      `https://moccasin-steady-hyena-592.mypinata.cloud/ipfs/${IpfsHash}`
    );

    return response;
  } catch (error) {
    console.log(`Contract Error: ${error}`);
  }
}

async function mint(req, res) {
  try {
    const filename = req.file.filename;
    const response = await pinFileToPinata(filename);

    if (response) {
      const { IpfsHash } = response.data;
      // console.log(IpfsHash)
      const { name, description, wallet, attributes } = req.body;
      const metadata = {
        name: name,
        Image: `https://gateway.pinata.cloud/ipfs/${IpfsHash}`,
        description: description,
        wallet: wallet,
        attributes: attributes,
      };

      const metaDataresponse = await uploadMetaDataToIPFS(metadata, filename);
      const metaDataHash = metaDataresponse.data.IpfsHash;

      if (metaDataresponse) {
        console.log(`Pinning Successfull`);
        try {
          const mintingResult = mintAnNft(metaDataHash);
          if (mintingResult) {
            res.status(200).send(`Nft Minted Successfully`);
          } else {
            res.status(404).send(`Unable to mint NFT`);
          }
        } catch (error) {}
      } else {
        res.status(404).send(`Unsuccessfull`);
      }
    } else {
      res.status(404).send(`Pinning Unsuccessfull`);
    }
  } catch (error) {
    console.log();
    console.log(`Pinning Error: ${error}`);
    res.status(404).send(`IPFS unavailable`);
  }
}

export { mint };
