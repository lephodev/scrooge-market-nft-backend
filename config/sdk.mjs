import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import affAddOrder from "./affiliate.mjs";
import { addChips } from "./rewards.mjs";
import OG_ABI from "./OG_ABI.json" assert { type: "json" };
import JR_ABI from "./JR_ABI.json" assert { type: "json" };
import { ObjectId } from "mongodb";
import * as db from "./mongodb.mjs";
import { allChains } from "wagmi-core";
import axios from "axios";

export const sdk = new ThirdwebSDK("https://bsc-dataseed4.binance.org/");
export const CasinoNFTEditionContractAddress =
  "0x729FDb31f1Cd2633aE26F0A87EfD0CC55a336F9f";
export const CasinoMarketplaceContractAddress =
  "0x91197754fCC899B543FebB5BE4dae193C75EF9d1";
export const OGContractAddress = "0x9DfeE72aEa65dc7e375d50Ea2Bd90384313A165A";
export const JRContractAddress = "0x2e9F79aF51dD1bb56Bbb1627FBe4Cc90aa8985Dd";
// export const DLContractAddress = "0xEe7c31b42e8bC3F2e04B5e1bfde84462fe1aA768";
export const BurnContractAddress = "0x000000000000000000000000000000000000dEaD";

//export const contractJR = await sdk.getContractFromAbi(JRContractAddress, JR_ABI);
// export const contractCasinoMarketplace = await sdk.getContract(
//   CasinoMarketplaceContractAddress
// );
// export const contract = await sdk.getContract(CasinoMarketplaceContractAddress);
export const sdk_casino_nfts = ThirdwebSDK.fromPrivateKey(
  process.env.CASINO_NFTS_PRIVATE_KEY,
  "binance"
);

// console.log("sdk_casino_nfts", sdk_casino_nfts);
// export const contractCasinoNFT = await sdk_casino_nfts.getContract(
//   CasinoNFTEditionContractAddress,
//   "edition"
// );

export const sdk_casino_nfts_wallet = await sdk_casino_nfts.wallet.getAddress();
export const sdk_OG = ThirdwebSDK.fromPrivateKey(
  process.env.OG_PRIVATE_KEY,
  "binance"
);
export const contractOG = await sdk_OG.getContractFromAbi(
  OGContractAddress,
  OG_ABI
);
export const sdk_OG_wallet = await sdk_OG.wallet.getAddress();
export const sdk_JR = ThirdwebSDK.fromPrivateKey(
  process.env.JR_PRIVATE_KEY,
  "binance"
);
export const contractJR = await sdk_JR.getContractFromAbi(
  JRContractAddress,
  JR_ABI
);
export const sdk_JR_wallet = await sdk_JR.wallet.getAddress();
export const sdk_DL = ThirdwebSDK.fromPrivateKey(
  process.env.DL_WALLET_PRIVATE_KEY,
  "ethereum"
);
// export const contractDL = await sdk_DL.getContract(DLContractAddress);
export const sdk_DL_wallet = await sdk_DL.wallet.getAddress();

export async function getDLNFTs(req, res) {
  const { address } = req.params;
  // const allNFTs = await contractDL.erc721.getAll(address);
  // console.log(allNFTs);
  // res.send({ allNFTs });
}

//functions
// export async function transferNFT(_user_id, _token_id, _address, order_total) {
//   console.log(
//     "transferNFT",
//     _user_id,
//     _token_id,
//     _address.trim(),
//     "sdk_casino_nfts_wallet",
//     sdk_casino_nfts_wallet,
//     "order_total",
//     order_total
//   );
//   const commission = (0.05 * order_total).toFixed(0);
//   console.log("Commision", commission);
//   let resp;
//   const balanceRaw = await contractCasinoNFT.balanceOf(
//     sdk_casino_nfts_wallet,
//     _token_id
//   );
//   const balance = parseInt(balanceRaw);
//   console.log("jivanBlance", balance);
//   // Verify sdk wallet / contract has enough balance to disburse prize
//   if (balance && balance >= 1) {
//     //sdk wallet has enough balance to allow prize redemption
//     console.log("Transferring NFT.......");
//     //initiate transfer from sdk wallet to redeemer wallet
//     try {
//       const transferStatus = await contractCasinoNFT
//         .transfer(_address.trim(), _token_id, 1)
//         .then(async (transfer) => {
//           console.log("Transfer Status: ", transfer);
//           let findUserAff = await db
//             .get_scrooge_usersDB()
//             .findOne({ _id: ObjectId(_user_id) });
//           // console.log("avvavavva",findUserAff);
//           let comisData = {
//             id: _user_id,
//             commision: parseInt(commission),
//           };
//           const query3 = await db.get_scrooge_usersDB().findOneAndUpdate(
//             { _id: ObjectId(findUserAff?.refrenceId) },
//             {
//               $inc: { wallet: parseInt(commission) },
//               $push: { affliateUser: comisData },
//             }
//           );
//           const query = await db.get_affiliatesDB().findOneAndUpdate(
//             { user_id: findUserAff?.refrenceId },
//             {
//               $inc: { total_earned: parseInt(commission) },
//               $set: { last_earned_at: new Date() },
//             }
//           );
//           let getUserData = await db
//             .get_scrooge_usersDB()
//             .findOne({ _id: ObjectId(findUserAff?.refrenceId) });
//           //  console.log("getUserData",getUserData);

//           const transactionPayload = {
//             amount: parseInt(commission),
//             transactionType: "commission",
//             prevWallet: getUserData?.wallet,
//             updatedWallet: getUserData?.wallet + commission,
//             userId: ObjectId(findUserAff?.refrenceId),
//             updatedTicket: commission,
//             updatedGoldCoin: getUserData?.goldCoin,
//             prevGoldCoin: getUserData?.goldCoin,
//             prevTicket: getUserData?.ticket,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           let trans_id;
//           console.log("transactionPayload", transactionPayload);
//           await db
//             .get_scrooge_transactionDB()
//             .insertOne(transactionPayload)
//             .then((trans) => {
//               console.log("transtranstrans", trans);
//               trans_id = trans.insertedId;
//             })
//             .catch((e) => {
//               console.log("e", e);
//             });

//           resp = true;
//         });
//     } catch (error) {
//       resp = false;
//     }
//   } else {
//     //sdk wallet does not have enough balance to allow prize redemption
//     console.log("Balance unacceptable");
//     resp = "Balance Unacceptable";
//   }
//   return resp;
// }

export async function getOGBalance(req, res) {
  let resp;
  const { address, signer } = req.params;
  try {
    const rawBal = await contractOG.erc20.balance(address);
    const bal = parseInt(rawBal.value / 10 ** 18);
    return res.status(200).send({ success: true, data: bal.toString() });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

// Route to disburse Free Tokens
// export async function getFreeTokens(req) {
//   let resp;
//   const address = req.params.address;
//   const token_id = req.params.token_id;
//   const user_id = req.params.user_id;
//   const qty = req.params.qty;
//   const aff_id = req.params.aff_id;

//   console.log("address==>>",address,"token_id===>>",token_id,"user_id===>>>",user_id,"qty===>>",qty,"aff_id===>>",aff_id);
// if (address && token_id && user_id) {
//   const query = await db
//     .get_marketplace_itemsDB()
//     .findOne({ token_id: parseInt(token_id) })
//     .then(async (item) => {
//       console.log("itemDatatataa");
//       const chipsAdded = await addChips(
//         user_id,
//         parseInt(item.chip_value),
//         address
//       ).then((trans) => {
//         console.log("trans",trans);
//         if (aff_id && aff_id != user_id) {
//           affAddOrder(
//             aff_id,
//             trans.toString(),
//             item.chip_value,
//             item._id.toString(),
//             user_id,
//             address
//           );
//         }
//         resp = item.chip_value.toString();
//       });
//     });
// }
// return resp;
// }
export async function getFreeTokens(req, res) {
  console.log("Calleddddd getFreeTokens", req.body);
  try {
    let resp;
    const { address, token_id, userid, qty, aff_id } = req?.body || {};
    console.log(
      "address==>>",
      address,
      "token_id===>>",
      token_id,
      "user_id===>>>",
      userid,
      "qty===>>",
      qty,
      "aff_id===>>",
      aff_id
    );
    if (address && token_id && userid) {
      const query = await db
        .get_marketplace_itemsDB()
        .findOne({ token_id: parseInt(token_id) })
        .then(async (item) => {
          console.log("itemDatatataa", item);
          const chipsAdded = await addChips(
            userid,
            parseInt(item.chip_value),
            address,
            "NFT Buy Token"
          ).then(async (trans) => {
            // console.log("trans",trans);
            const commission = (0.05 * item?.chip_value).toFixed(0);
            console.log("commission", commission);
            let findUserAff = await db
              .get_scrooge_usersDB()
              .findOne({ _id: ObjectId(userid) });
            console.log("avvavavva", findUserAff);
            if (findUserAff?.refrenceId !== "false") {
              let comisData = {
                id: userid,
                commision: parseInt(commission),
              };
              const query3 = await db.get_scrooge_usersDB().findOneAndUpdate(
                { _id: ObjectId(findUserAff?.refrenceId) },
                {
                  $inc: { wallet: parseInt(commission) },
                  $push: { affliateUser: comisData },
                }
              );
              const query = await db.get_affiliatesDB().findOneAndUpdate(
                { user_id: findUserAff?.refrenceId },
                {
                  $inc: { total_earned: parseInt(commission) },
                  $set: { last_earned_at: new Date() },
                }
              );
              let getUserData = await db
                .get_scrooge_usersDB()
                .findOne({ _id: ObjectId(findUserAff?.refrenceId) });
              //  console.log("getUserData",getUserData);

              const { _id, username, email, firstName, lastName, profile } =
                getUserData;

              const transactionPayload = {
                amount: parseInt(commission),
                transactionType: "commission",
                prevWallet: getUserData?.wallet,
                updatedWallet: getUserData?.wallet + commission,
                userId: {
                  _id,
                  username,
                  email,
                  firstName,
                  lastName,
                  profile,
                },
                updatedTicket: commission,
                updatedGoldCoin: getUserData?.goldCoin,
                prevGoldCoin: getUserData?.goldCoin,
                prevTicket: getUserData?.ticket,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              let trans_id;
              console.log("transactionPayload", transactionPayload);
              await db
                .get_scrooge_transactionDB()
                .insertOne(transactionPayload)
                .then((trans) => {
                  console.log("transtranstrans", trans);
                  trans_id = trans.insertedId;
                });
            }

            if (aff_id && aff_id != userid) {
              affAddOrder(
                aff_id,
                trans.toString(),
                item.chip_value,
                item._id.toString(),
                userid,
                address
              );
            }
            resp = item.chip_value.toString();
          });
        });
    }
    let GetUser = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(userid) });

    GetUser.id = GetUser?._id;
    return res.status(200).send({ success: true, data: resp, user: GetUser });
  } catch (error) {
    console.log("error", error);
  }
}

// Route to get user's NFT balance
// export async function getWalletNFTBalanceByTokenID(req) {
//   let resp;
//   const address = req.params.address;
//   const token_id = req.params.token_id;
//   const user_id = req.params.user_id;
//   const qty = req.params.qty;
//   if (address && token_id) {
//     const bal = await contractCasinoNFT.erc1155.balanceOf(address, token_id);
//     resp = bal.toString();
//   } else {
//     resp = "0";
//   }
//   return resp;
// }

export async function getOGCurrentPrice() {
  let curr_price;
  await axios
    .post("https://api.coinbrain.com/public/coin-info", {
      56: [OGContractAddress],
    })
    .then(
      (response) => {
        console.log("response", response);

        curr_price = response.data[0].priceUsd;
      },
      (error) => {
        console.log(error);
      }
    );
  // await fetch(
  //   "https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0x9DfeE72aEa65dc7e375d50Ea2Bd90384313A165A"
  // )
  //   .then((response) => response.json())
  //   .then((data) => {
  //     curr_price = data.market_data.current_price.usd;
  //   })
  //   .catch((e) => {
  //     console.log(e);
  //     curr_price = false;
  //   });

  console.log("curr_pricecurr_pricecurr_price", curr_price);
  return curr_price;
}

export async function getJRCurrentPrice() {
  let curr_price;
  await fetch(
    "https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0x2e9f79af51dd1bb56bbb1627fbe4cc90aa8985dd"
  )
    .then((response) => response.json())
    .then((data) => {
      curr_price = data.market_data.current_price.usd;
    })
    .catch((e) => {
      console.log(e);
      curr_price = false;
    });
  return curr_price;
}

export async function getWalletDLBalance(req) {
  let balanceRaw, balance, resp;
  const address = req.params.address;
  if (address) {
    // balanceRaw = await contractDL.erc721.balance(address);
    // balance = parseInt(balanceRaw);
    // if (balance > 0) {
    //   resp = balance.toString();
    // } else {
    //   resp = "Not Enough Balance";
    // }
  }
  return resp;
}

//export default sdk;
