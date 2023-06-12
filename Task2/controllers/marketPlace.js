import axios from "axios";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { contractAbi } from "../abi.js";
import { MarketPlaceModel } from "../models/marketPlaceMod.js";

dotenv.config();

// const pinataApiKey = process.env.API_KEY;
// const pinataSecretApiKey = process.env.SECRET_API_KEY;
// const endpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";

const contractAddress = process.env.CONTRACT_ADDRESS;
const mumbaiRpc = process.env.RPC;
const privateKey = process.env.WALLET_PRIVATE_CODE;

const listNFT = async (req, res) => {
  const { tokenId, price, transactionHash, wallet, contractAddress } = req.body;
  console.log(req);
  try {
    console.log(wallet);
    let sellerWallet = await toString(wallet);
    console.log(sellerWallet);

    let escroWallet = process.env.WALLET_PUBLIC_CODE;

    const provider = new ethers.providers.JsonRpcBatchProvider(
      process.env.MUMBAI_URL
    );

    const transaction = await provider.getTransaction(transactionHash);

    console.log(transaction);

    if (transaction.from.toUpperCase() == sellerWallet) {
      const provider = new ethers.providers.JsonRpcProvider(mumbaiRpc);
      const nftContractData = new ethers.Contract(
        contractAddress,
        contractAbi,
        provider
      );

      const owner = await nftContractData.ownerOf(parseInt(tokenId));

      const tokenURI = await nftContractData.tokenURI(tokenId);

      if (owner == escroWallet) {
        try {
          const response = await axios.get(tokenURI);
          const metaData = response.data;
          console.log("Meta Data");
          console.log(metaData);
          const doc = {
            tokenId: tokenId,
            price: price,
            seller: metaData.wallet,
            metadata: {
              name: metaData.name,
              description: metaData.description,
              image: metaData.image,
              attributes: metaData.attributes,
            },
          };

          const modelDocumnet = new MarketPlaceModel(doc);

          await modelDocumnet.save();

          res.status(200).send({
            status: "success",
            message: "NFT listed successfully",
          });
        } catch (err) {
          console.log("Error In fetching Meta Data From IPFS");
          res.status(404).send({
            status: "error",
            message: "Saving in Data Base and Fetching",
          });
        }
      } else {
        res.status(404).send({
          status: "error",
          message: "Unknown Owner",
        });
      }
    }
  } catch (err) {
    console.log("Listing NFT Error");
    console.log(err);
    res.send({
      status: "error",
      message: "Not Listed",
    });
  }
};

const getAllNFT = async (req, res) => {
  try {
    const getAll = await MarketPlaceModel.find();

    console.log(getAll);
    res.status(200).send({
      status: "success",
      message: "Listed NFTs retrieved successfully",
      nfts: getAll,
    });
  } catch (err) {
    console.log("Error");
    res.send({
      status: "error",
      message: "Fetching from DB Error",
    });
    console.log(err);
  }
};

const nftDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const nftDetails = await MarketPlaceModel.findById(id);

    res.status(200).send({
      status: "success",
      message: "NFT details retrieved successfully",
      nft: nftDetails,
    });
  } catch (err) {
    console.log("Fetching Error ");
    console.log(err);
    res.status(404).send({
      status: "error",
      message: "Fetchinf Error",
    });
  }
};

const buyNft = async (req, res) => {
  const { nftId, buyer, paymentHash } = req.body;
  console.log(buyer);

  try {
    // const nftDetail = await MarketPlaceModel.find({ tokenId: nftId });

    let buyerWallet = buyer.toUpperCase();
    let escroWallet = process.env.ESCROW_Wallet_Address;

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.MUMBAI_URL
    );

    const transaction = await provider.getTransaction(paymentHash);

    // console.log("Payment Hash Result ")
    // console.log(transaction)

    let valueTransfer = transaction.value.toString();

    // console.log("Value from Transaction")
    // console.log(valueTransfer)

    const listedTokenDetails = await MarketPlaceModel.findById(nftId);

    console.log("Listed Token Details");
    console.log(listedTokenDetails.tokenId);

    if (!listedTokenDetails) {
      res.status(400).send({
        status: "error",
        message: "There is no nft with this ID in our Database",
      });
    }

    try {
      if (transaction.from.toUpperCase() == buyerWallet) {
        if (transaction.to.toUpperCase() == escroWallet.toUpperCase()) {
          const paymentInDB = PyamentHashModel.findOne({ hash: paymentHash });
          console.log("Payment In DB");
          console.log(paymentInDB.hash);

          if (paymentInDB.hash != null) {
            res.status(400).send({
              status: "error",
              message: "Payment is Already Consumed!",
            });
            return;
          }

          const ethValue = ethers.utils.formatEther(valueTransfer);
          console.log("Eth Value");

          console.log(ethValue);
          console.log(listedTokenDetails.price);

          try {
            const doc = new PyamentHashModel({
              hash: paymentHash,
            });

            const resultSaved = await doc.save();
            if (ethValue >= listedTokenDetails.price) {
              const transferResult = await ERC720Controller.transferNft(
                listedTokenDetails.tokenId,
                buyer
              );

              if (transferResult.status) {
                // Transfer Payment to Seller after deduction of 2% fees
                const fees = (parseFloat(listedTokenDetails.price) * 2) / 100;
                const valueToSend = parseFloat(listedTokenDetails.price) - fees;

                const wallet = new ethers.Wallet(
                  process.env.WALLET_PRIVATE_KEY,
                  provider
                );

                const transactionSendEthes = await wallet.sendTransaction({
                  to: listedTokenDetails.seller,
                  value: ethers.utils.parseEther(valueToSend.toString()),
                  gasLimit: 50000,
                });

                res.status(200).send({
                  status: "success",
                  message: "Money Transfer to seller and NFT Transfer to Buyer",
                });
                return;
              } else {
                const reverse = await PyamentHashModel.findByIdAndDelete(
                  resultSaved._id
                );
                res.status(400).send({
                  status: "error",
                  message: "Transaction Failed!",
                });
                return;
              }
            }
          } catch (err) {
            res.status(200).send({
              status: "success",
              message: "You have consumed this transaction",
            });
            return;
          }
        } else {
          res.status(400).send({
            status: "error",
            message: "Payment is not sent to Our Escro Wallet",
          });
          return;
        }
      } else {
        res.status(400).send({
          status: "error",
          message: "Buyer is not matched with transaction sender",
        });
        return;
      }
    } catch (err) {
      console.log("Inside Error TRY Catch");
      console.log(err);
      res.status(400).send({
        status: "error",
        message: "Transation hash metching Error",
      });
      return;
    }
  } catch (err) {
    console.log("Fetching Erroe");
    console.log(err);
    res.status(400).send({
      status: "error",
      message: "Fetching Error",
    });
    return;
  }
};

export { listNFT, getAllNFT, nftDetails, buyNft };
