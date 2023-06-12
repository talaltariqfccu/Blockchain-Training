import { ethers } from "ethers";
import dotenv from "dotenv";
import { contractAbi } from "../abi.js";

dotenv.config();

async function listenser(req, res) {

    
  const contractAddress = await process.env.CONTRACT_ADDRESS;
  const mumbaiRpc = await process.env.RPC;
  const privateKey = await process.env.WALLET_PRIVATE_CODE;

  const providor = new ethers.providers.JsonRpcProvider(mumbaiRpc);
  const wallet = new ethers.Wallet(privateKey, providor);

  try {
    const contract = new ethers.Contract(
      contractAddress,
      contractAbi,
      providor
    );

    
    const hist =await contract.on(`Transfer`,(from, to, tokenid, events)=>{
      let info={
        transferedFrom: from,
        transferedTo: to,
        tokenId: tokenid,
        data:events
      }
      console.log(JSON.stringify(info, null, 4));
    });
    

    
  } catch (error) {
    console.log(`Contract Error: ${error}`);
  }
}
listenser();
