import * as db from "./mongodb.mjs";
import * as useSDK from "./sdk.mjs";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

import * as email from "../email/email.mjs";
import * as commons from "./commons.mjs";
import { ObjectId } from "mongodb";
import itemModel from "../models/itemModel.mjs";
import mongoose from "mongoose";
const { Schema } = mongoose;

export async function addChips(_user_id, _qty, _address, transactionType, gc) {
  try {
    console.log("Chpis Added", _user_id, _qty, _address, transactionType);
    let qry = {};
    let trans_id;
    // scrooge db transaciton for this users with field prevwallet, updatedWallet,amount, source - monthly claim
    // Crypto To Gold Coin
    console.log("goldcoin", gc);
    if (transactionType === "Crypto To Gold Coin") {
      qry = { wallet: _qty, goldCoin: gc };
    } else {
      qry = { wallet: _qty };
    }
    const query = await db
      .get_scrooge_usersDB()
      .findOneAndUpdate({ _id: ObjectId(_user_id) }, { $inc: qry })
      .then(async (user) => {
        const queryCT = await db
          .get_marketplace_chip_transactionsDB()
          .insertOne({
            user_id: ObjectId(_user_id),
            address: _address,
            chips: _qty,
            timestamp: new Date(),
          });
        console.log("queryCT queryCT", _qty);

        let getUserData = await db
          .get_scrooge_usersDB()
          .findOne({ _id: ObjectId(_user_id) });

        console.log("getUserDatauuuuu", getUserData);

        const transactionPayload = {
          amount: _qty,
          transactionType: transactionType || "Unknown Transaction",
          prevWallet: getUserData?.wallet,
          prevGoldCoin: getUserData?.goldCoin,
          updatedWallet: getUserData?.wallet + _qty,
          userId: ObjectId(_user_id),
          updatedTicket: getUserData?.ticket + _qty,
          updatedGoldCoin: getUserData?.goldCoin + _qty,

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log("transactionPayloadPPPPP", transactionPayload);
        await db
          .get_scrooge_transactionDB()
          .insertOne(transactionPayload)
          .then((trans) => {
            trans_id = trans.insertedId;
          });
      });
    return { code: 200, message: " token buy success" };
  } catch (error) {
    console.log("errrr", error);
    return { code: 400, message: "token buy faild" };
  }
}

export async function getNextClaimDate(req, res) {
  let resp;
  const { address, type, user_id, token_id } = req.params;
  console.log("add", address);
  let collection, qry, nextClaimDate, lastClaimDate;
  if (type === "holder") {
    collection = db.get_marketplace_holder_claim_chips_transactionsDB();
    qry = { address: address };
  } else if (type === "dl") {
    collection = db.get_marketplace_ducky_lucks_chip_claimsDB();
    qry = { token_id: token_id };
  } else if (type === "daily") {
    collection = db.get_marketplace_daily_reward_token_claimsDB();
    qry = { user_id: user_id };
  }
  try {
    const sort = { claimDate: -1 };
    const data = await collection.find(qry).sort(sort).toArray();
    //const data = await cursor.toArray();
    console.log("------", data);
    if (typeof data[0] !== "undefined") {
      if (type === "daily") {
        lastClaimDate = data[0].claimDate;
        nextClaimDate = new Date(data[0].claimDate);
        nextClaimDate.setDate(nextClaimDate.getDate() + 1);
        data[0].nextClaimDate = nextClaimDate;
        console.log("data---", data);
        if (typeof nextClaimDate != "undefined") {
          console.log("data-=-", data);
          return res.status(200).send({ success: true, data: data });
        } else {
          return res.send({
            success: false,
            message: "No Entries Found",
          });
        }
      } else {
        lastClaimDate = data[0].claimDate;
        nextClaimDate = new Date(data[0].claimDate);
        nextClaimDate.setDate(nextClaimDate.getDate() + 30);
        if (typeof nextClaimDate != "undefined") {
          return res.status(200).send({ success: true, data: data });
        } else {
          return res.send({
            success: false,
            message: "No Entries Found",
          });
        }
      }
    } else {
      console.log("else");
      return res.send({
        success: false,
        message: "No Entries Found",
      });
    }
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function claimDLTokens(req) {
  let resp;
  const address = req.params.address;
  const user_id = req.params.user_id;
  const token_id = req.params.token_id;
  let balance,
    balanceRaw,
    rarity_pct,
    rarity_pts,
    prevmonth,
    lastClaimDate,
    isClaimable = false;
  if (address && user_id && token_id) {
    const checkOwner = await useSDK.contractDL.call("ownerOf", token_id);
    const getNFT = await useSDK.contractDL.erc721.get(token_id);
    // rarity_pct = getNFT.metadata.attributes[12].value;
    rarity_pts = getNFT.metadata.attributes[11].value;

    /*balanceRaw = await useSDK.contractDL.call("balanceOf", address);
        balance = parseInt(balanceRaw);*/
    if (getNFT.owner === address) {
      // const qty = (1500 * (rarity_pct / 100)).toFixed(0);
      const qty = (500 - rarity_pts).toFixed(0);

      const qry = { token_id: token_id };
      const sort = { claimDate: -1 };
      const cursor = db
        .get_marketplace_ducky_lucks_chip_claimsDB()
        .find(qry)
        .sort(sort);
      const arr = await cursor.toArray().then(async (data) => {
        const today = new Date();
        let nextmonth = new Date();
        nextmonth.setDate(nextmonth.getDate() + 30);
        if (typeof data[0] != "undefined") {
          lastClaimDate = data[0].claimDate;
          prevmonth = new Date(data[0].claimDate);
          prevmonth.setDate(prevmonth.getDate() - 30);
        }
        if (typeof lastClaimDate != "undefined") {
          //console.log(today);
          //console.log(nextmonth);
          //console.log(lastClaimDate);
          //console.log(prevmonth);
          if (lastClaimDate <= prevmonth) {
            //console.log("Available");
            isClaimable = true;
          } else {
            //console.log("Unavailable");
            isClaimable = false;
          }
        } else {
          //console.log("No Claim Date");
          isClaimable = true;
        }
        if (isClaimable) {
          //console.log("isClaimable is true");
          const queryCT = await db
            .get_marketplace_ducky_lucks_chip_claimsDB()
            .insertOne({
              token_id: token_id,
              address: address,
              user_id: user_id,
              qty: parseInt(qty),
              claimDate: new Date(),
              nextClaimDate: nextmonth,
            })
            .then(async (trans) => {
              //console.log("Transaction recorded");
              const chipsAdded = await addChips(
                user_id,
                parseInt(qty),
                address,
                "DL Token Claim"
              ).then(() => {
                //console.log("after send qty: ", qty);
                resp = qty.toString();
              });
            });
        } else {
          //console.log("isClaimable is false");
          resp = "ZERO! You are not allowed to claim yet.";
        }
      });
    } else {
      resp = "Not Enough Balance";
    }
  }
  return resp;
}

// Route to claim daily rewards
export async function claimDailyRewards(req) {
  let resp;
  const user_id = req.params.user_id;
  let isClaimable = false;
  let isConsecutive = false;
  let consecutive_days = 0;
  let lastClaimDate;
  let prevday, consecutiveDate;
  let qty = 25;
  const qry = { user_id: user_id };
  const sort = { claimDate: -1 };
  let getKycuser = await db
    .get_scrooge_user_kycs()
    .findOne({ userId: ObjectId(user_id) });
  // console.log("getKycuser---->>>>",getKycuser);
  if (getKycuser?.status === "accept") {
    const cursor = db
      .get_marketplace_daily_reward_token_claimsDB()
      .find(qry)
      .sort(sort);
    const arr = await cursor.toArray().then(async (data) => {
      const today = new Date();
      let nextday = new Date();
      nextday.setDate(nextday.getDate() + 1);
      if (typeof data[0] != "undefined") {
        lastClaimDate = data[0].claimDate;
        prevday = new Date();
        prevday.setDate(prevday.getDate() - 1);
        consecutiveDate = new Date(data[0].claimDate);
        consecutiveDate.setDate(consecutiveDate.getDate() - 2);
        console.log("prevday", prevday);
        console.log("consecutiveDate", consecutiveDate);
      }
      if (typeof lastClaimDate != "undefined") {
        if (lastClaimDate.getTime() <= prevday.getTime()) {
          //console.log("Available");
          isClaimable = true;
          if (lastClaimDate.getTime() >= consecutiveDate.getTime()) {
            //console.log("is consecutive");
            isConsecutive = true;
            consecutive_days = data[0].consecutive_days + 1;
            //console.log('cons days: ', consecutive_days);
            if (consecutive_days === 1) {
              qty = 25;
            } else if (consecutive_days === 2) {
              qty = 35;
            } else if (consecutive_days === 3) {
              qty = 45;
            } else if (consecutive_days === 4) {
              qty = 65;
            } else if (consecutive_days === 5) {
              qty = 25;
              consecutive_days = 1;
            }
          }
        } else {
          //console.log("Unavailable");
          isClaimable = false;
        }
      } else {
        //console.log("No Claim Date");
        isClaimable = true;
      }

      if (isClaimable) {
        //console.log("isClaimable is true");
        const queryCT = await db
          .get_marketplace_daily_reward_token_claimsDB()
          .insertOne({
            user_id: user_id,
            qty: qty,
            claimDate: new Date(),
            consecutive_days: consecutive_days,
          })
          .then(async (trans) => {
            //console.log("Transaction recorded");
            const chipsAdded = await addChips(
              user_id,
              qty,
              user_id,
              "Daily Reward Claim"
            ).then(() => {
              resp = {
                success: true,
                data: qty.toString(),
                message: "Token claimed",
              };
            });
          });
      } else {
        //console.log("isClaimable is false");
        resp = {
          success: false,
          message: "ZERO! You are not allowed to claim yet.",
        };
      }
    });
  } else {
    resp = { success: false, message: "Your kyc is not approved." };
  }
  return resp;
}

// Route to claim holder monthly Tokens
export async function claimHolderTokens(req) {
  let resp;
  const bal = req.params.OGbalance;
  const address = req.params.address;
  const user_id = req.params.user_id;
  const current_price = req.params.currentPrice;
  let isClaimable = false,
    prevmonth,
    OGValue,
    lastClaimDate;
  if (address && user_id && bal && current_price) {
    console.log("bal========12", bal);
    let OGValueIn = (current_price * bal).toFixed(0);
    if (OGValueIn < 50) {
      return (resp = { msg: "You don't have enough OG coins.", code: 400 });
    } else if (OGValueIn > 3000) {
      OGValue = 3000;
    } else {
      OGValue = OGValueIn;
    }
    console.log(OGValue);
    resp = { data: OGValue, code: 200 };

    //console.log('Value: ',OGValue);
    if (OGValue > 0) {
      const qry = { address: address };
      const sort = { claimDate: -1 };
      const cursor = db
        .get_marketplace_holder_claim_chips_transactionsDB()
        .find(qry)
        .sort(sort);
      const arr = await cursor.toArray().then(async (data) => {
        const today = new Date();
        let nextmonth = new Date();
        nextmonth.setDate(nextmonth.getDate() + 30);
        if (typeof data[0] != "undefined") {
          lastClaimDate = data[0].claimDate;
          prevmonth = new Date();
          prevmonth.setDate(prevmonth.getDate() - 30);
        }
        if (typeof lastClaimDate != "undefined") {
          if (lastClaimDate <= prevmonth) {
            //console.log("Available");
            isClaimable = true;
          } else {
            //console.log("Unavailable");
            isClaimable = false;
          }
        } else {
          //console.log("No Claim Date");
          isClaimable = true;
        }
        if (isClaimable) {
          //console.log("isClaimable is true");
          const queryCT = await db
            .get_marketplace_holder_claim_chips_transactionsDB()
            .insertOne({
              address: address,
              user_id: user_id,
              qty: parseInt(OGValue),
              claimDate: new Date(),
              nextClaimDate: nextmonth,
            })
            .then(async (trans) => {
              //console.log("Transaction recorded");
              const chipsAdded = await addChips(
                user_id,
                parseInt(OGValue),
                address,
                "Monthly Reward Claim"
              ).then((data) => {
                resp = { data: OGValue, code: 200 };
              });
            });
        } else {
          //console.log("isClaimable is false");
          resp = { msg: "ZERO! You are not allowed to claim yet.", code: 400 };
        }
      });
    } else {
      //console.log("ZERO Balance");
      resp = {
        msg: "ZERO! You do not hold enough Scrooge Coin crypto.",
        code: 400,
      };
    }
  }
  return resp;
}

export async function getCryptoToGCPackages(req, res) {
  const qry = {};
  const sort = { price: 1 };
  let resp;
  const cursor = db.get_marketplace_gcPackagesDB().find(qry).sort(sort);

  const arr = await cursor.toArray().then((data) => {
    resp = data;
    console.log(data);
  });
  return res.send(resp);
}

export async function getPrizes(req) {
  const qry = {};
  const sort = { price: 1 };
  let resp;
  const cursor = db.get_marketplace_prizesDB().find(qry).sort(sort);
  console.log("itemModel");
  const data = [{ contract: "hghhh", price: 70 }];

  // const userSchema = new Schema({
  //   contract: {type:String}
  // });

  // const User = mongoose.model('Usersss', userSchema);

  // const user = new User({
  //   contract: 'John'
  // });

  // user.save().then(() => {
  //   console.log('User saved to collection');
  // }).catch((error) => {
  //   console.error(error);
  // });
  const arr = await cursor.toArray().then((data) => {
    resp = data;
  });
  return resp;
}

export async function getItems(req) {
  const type = req.params.type;
  let qry;
  if (type) {
    qry = { type: "entry" };
  } else {
    qry = {};
  }
  const sort = { price: 1 };
  let resp;
  const cursor = db.get_marketplace_itemsDB().find(qry).sort(sort);
  const arr = await cursor.toArray().then((data) => {
    //console.log('prizes arr: ', data);
    resp = data;
  });
  return resp;
}

export async function postPrizeRedemption(
  prize_id,
  user_id,
  coupon_code = null,
  markRedeemed = null
) {
  let resp;
  try {
    const queryCT = await db
      .get_marketplace_redeem_prize_transactionsDB()
      .insertOne({
        user_id: user_id,
        prize_id: prize_id,
        timestamp: new Date(),
        coupon_code: coupon_code,
        markRedeemed: markRedeemed,
      })
      .then((trans) => {
        console.log(trans);
        resp = true;
      });
  } catch (error) {
    console.log(error);
    resp = false;
  }
  return resp;
}

export async function getUserRedeemed(req) {
  let resp;
  const user_id = req.params.user_id;
  const qry = { user_id: user_id };
  const sort = { timestamp: -1 };
  const aggCursor = await db
    .get_marketplace_redeem_prize_transactionsDB()
    .aggregate([
      { $match: { user_id: user_id } },
      { $sort: { timestamp: -1 } },
      {
        $lookup: {
          from: "prizes",
          let: { searchID: { $toObjectId: "$prize_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$searchID"],
                },
              },
            },
            { $project: { category: 1, name: 1, image_url: 1 } },
          ],
          as: "prize_details",
        },
      },
    ]);
  const arr = await aggCursor.toArray().then((data) => {
    resp = data;
  });
  return resp;
}

export async function getMerchCouponCode(store_id, discount_type) {
  let coupon, coupon_code;
  const query = await db
    .get_marketplace_coupons_merchDB()
    .findOne({
      isClaimed: false,
      store_id: "JR",
      coupon_code: new RegExp("^" + discount_type + ""),
    })
    .then((coup) => {
      coupon = coup;
      //return true;
    });
  return coupon;
}

export async function updateMerchClaimFlag(coupon_obj_id, user_id) {
  let resp;
  try {
    const query = await db
      .get_marketplace_coupons_merchDB()
      .findOneAndUpdate(
        { _id: ObjectId(coupon_obj_id) },
        { $set: { isClaimed: true, user_id: user_id, claim_time: new Date() } }
      )
      .then(async (data) => {
        resp = true;
      });
  } catch (error) {
    console.log(error);
    resp = false;
  }
  return resp;
}

export async function updateMerchRedeemedFlag(trans_id, user_id) {
  let resp;
  try {
    const query = await db
      .get_marketplace_redeem_prize_transactionsDB()
      .findOneAndUpdate(
        { _id: ObjectId(trans_id) },
        { $set: { markRedeemed: true, user_id: user_id } }
      )
      .then(async (data) => {
        resp = true;
      });
  } catch (error) {
    console.log(error);
    resp = false;
  }
  return resp;
}

export async function markMerchCouponRedeemed(req) {
  const trans_id = req.params.trans_id;
  const user_id = req.params.user_id;
  const updatedFlag = await updateMerchRedeemedFlag(trans_id, user_id);
  return "Code Marked as Redeemed";
}

export async function updateDLClaimFlag(DL_token_obj_id) {
  let resp;
  try {
    const query = await db
      .get_marketplace_ducky_lucks_prizesDB()
      .findOneAndUpdate(
        { _id: ObjectId(DL_token_obj_id) },
        { $set: { claimed: true } }
      )
      .then(async (data) => {
        resp = true;
      });
  } catch (error) {
    console.log(error);
    resp = false;
  }
  return resp;
}

export async function redeemPrize(req, res) {
  console.log("abbcccc");
  let resp;
  let trans_id;
  const user_id = req.params.user_id;
  const address = req.params.address;
  const prize_id = req.params.prize_id;
  let sdk,
    balance,
    balanceRaw,
    curr_price,
    prize_name,
    prize_price,
    coupon,
    coupon_code,
    coupon_obj_id,
    discount_type,
    store_id,
    prize_token_qty,
    prize_contract,
    prize_contract_name,
    user_ticket,
    prize_token_type,
    prize_redeem_action,
    prize_token_id,
    DL_token_id,
    DL_token_obj_id,
    prize_category,
    use_sdk;

  try {
    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(user_id) });
    // console.log("getKycuser---->>>>",getKycuser);
    // const {status}=getKycuser
    if (getKycuser?.status === "accept") {
      const prize = await db
        .get_marketplace_prizesDB()
        .findOne({ _id: ObjectId(prize_id) });
      console.log("prise", prize);
      // assign prize attributes to variables
      prize_name = prize.name; // price of selected prize in tickets
      prize_price = prize.price; // price of selected prize in tickets
      if (prize.isDynamic) {
        //coupon_code = await getMerchCouponCode('JR', 'pr10off');
        //console.log("post coupon code: ", coupon_code);
        if (prize.contract === "0xfA1BA18067aC6884fB26e329e60273488a247FC3") {
          console.log("OG");
          curr_price = await useSDK.getOGCurrentPrice();
        } else if (
          prize.contract === "0x2e9F79aF51dD1bb56Bbb1627FBe4Cc90aa8985Dd"
        ) {
          console.log("JR");
          curr_price = await useSDK.getJRCurrentPrice();
        }
        prize_token_qty = (prize_price / 100 / curr_price).toFixed(0);
        console.log("prize_token_qty", prize_token_qty);
      } else {
        prize_token_qty = prize.token_qty;
        console.log("prize_token_qty2", prize_token_qty); // quantity of tokens to be transferred upon redemption
      }
      prize_category = prize.category; // category of prize
      console.log("cat", prize_category);
      if (prize_category === "Merch") {
        store_id = prize.store_id;
        discount_type = prize.discount_type;
        coupon = await getMerchCouponCode(store_id, discount_type);
        coupon_obj_id = coupon._id;
        coupon_code = coupon.coupon_code;
      }
      prize_contract = prize.contract; // contract address of prize
      prize_contract_name = prize.contract_name; // shorthand name for contract of prize
      prize_token_type = prize.token_type; // token type (erc20/erc721/erc1155) of prize
      prize_token_id = prize.token_id; // token_id of prize (null if erc20)
      prize_redeem_action = prize.redeem_action; // action to execute redemption of prize
      if (prize_name === "Ducky Lucks NFT") {
        const queryDL = await db
          .get_marketplace_ducky_lucks_prizesDB()
          .findOne({ claimed: false });
        console.log(" ", queryDL);
        DL_token_id = queryDL?.token_id;
        DL_token_obj_id = queryDL._id;
      }

      // get user record from users table by _id
      const user = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(user_id) });

      console.log(user);

      //  console.log('user', user);
      user_ticket = user.ticket; //user's available ticket balance
      // verify user has more (or equal) tickets than price of prize
      if (user_ticket >= prize_price) {
        //  console.log("query3", query3);

        if (prize_contract_name === "OG") {
          use_sdk = useSDK.sdk_OG;
        } else if (prize_contract_name === "JR") {
          console.log("JRRRRR");
          use_sdk = useSDK.sdk_JR;
        } else if (prize_contract_name === "Casino NFTS") {
          use_sdk = useSDK.sdk_casino_nfts;
        } else if (prize_contract_name === "DL") {
          use_sdk = useSDK.sdk_DL;
          //console.log("usesdk", use_sdk);
        } else if (prize_category === "Merch") {
          use_sdk = useSDK.sdk;
        } else {
          // prize_contract_name does not match any known contract names
          resp = "Invalid Prize Data";
          return res.send({ success: false, message: resp });
        }
        if (prize_token_type === "erc20") {
          balanceRaw = await use_sdk.wallet.balance(prize_contract);
          balance = parseInt(balanceRaw.displayValue);
          console.log("Balance: ", use_sdk);
          // Verify sdk wallet / contract has enough balance to disburse prize
          console.log("bal123", balance);
          console.log("prize_token_qty", prize_token_qty);
          prize_token_qty = prize_token_qty - prize_token_qty * 0.01;
          if (balance && balance >= prize_token_qty) {
            //sdk wallet has enough balance to allow prize redemption
            //check for redeem_action from prize record
            if (prize_redeem_action === "transfer") {
              //initiate transfer from sdk wallet to redeemer wallet
              try {
                console.log("addresss", address);
                console.log(" prize_token_qty", prize_token_qty);
                console.log("prize_redeem_action", prize_redeem_action);
                console.log("prize_contract", prize_contract);
                console.log("address", address);
                const transfer = await use_sdk.wallet.transfer(
                  address,
                  prize_token_qty,
                  prize_contract
                );
                console.log("transfer", transfer);
                const query3 = await db
                  .get_scrooge_usersDB()
                  .findOneAndUpdate(
                    { _id: ObjectId(user_id) },
                    { $inc: { ticket: -prize_price } }
                  );
                let getUserData = await db
                  .get_scrooge_usersDB()
                  .findOne({ _id: ObjectId(user_id) });
                //  console.log("getUserData",getUserData);

                const transactionPayload = {
                  amount: prize_price,
                  transactionType: "Crypto Redeem",
                  prevWallet: getUserData?.wallet,
                  updatedWallet: getUserData?.wallet + prize_price,
                  userId: ObjectId(user_id),
                  updatedTicket: getUserData?.ticket - prize_price,
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
                  })
                  .catch((e) => {
                    console.log("e", e);
                  });
                console.log("transfer erc20 ", transfer);
                postPrizeRedemption(prize_id, user_id);
                resp = prize_name;
                return res.status(200).send({ success: true, message: resp });
              } catch (error) {
                console.log(error);
                console.log("error---", error);
                console.log("Transaction Failed712", error?.reason);
                resp = error?.reason || "Transaction Failed";
                //console.log('Transaction Failed');
                // resp = "Transaction Failed";
                return res.send({ success: false, message: resp });
              }
            } else if (prize_redeem_action === "burn") {
              //initiate burn from sdk wallet
              try {
                //const burn = await use_sdk.wallet.transfer(useSDK.BurnContractAddress, prize_token_qty, prize_contract);
                //console.log('Status: ', transfer.receipt.status);
                const query3 = await db
                  .get_scrooge_usersDB()
                  .findOneAndUpdate(
                    { _id: ObjectId(user_id) },
                    { $inc: { ticket: -prize_price } }
                  );
                postPrizeRedemption(prize_id, user_id);
                resp = prize_name;
                return res.status(200).send({ success: true, message: resp });
              } catch (error) {
                //console.log('Transaction Failed');
                resp = "Transaction Failed";
                return res.send({ success: false, message: resp });
              }
            } else {
              // prize_redeem_action does not match any known redeem actions
              resp = "Invalid Prize Data";
              return res.send({ success: false, message: resp });
            }
          } else {
            //sdk wallet does not have enough balance to allow prize redemption
            //console.log("Balance unacceptable");
            resp = "Balance Unacceptable";
            return res.send({ success: false, message: resp });
          }
        } else if (prize_token_type === "erc1155") {
          //start erc1155 process

          const sdk_wallet = await use_sdk.wallet.getAddress();
          console.log("useSDK.contractCasinoNFT", sdk_wallet);
          // balanceRaw = await use_sdk.wallet.balance(sdk_wallet);
          balanceRaw = await useSDK.contractCasinoNFT.erc1155.balanceOf(
            sdk_wallet,
            prize_token_id
          );
          console.log("balraw", balanceRaw);
          console.log("prize_token_id", prize_token_id);
          console.log("prize_token_type", prize_token_type);
          balance = parseInt(balanceRaw);
          // Verify sdk wallet / contract has enough balance to disburse prize
          console.log("balance", balance);
          console.log("prizeTokenQty", prize_token_qty);
          if (balance && balance >= prize_token_qty) {
            //sdk wallet has enough balance to allow prize redemption
            //check for redeem_action from prize record
            if (prize_redeem_action === "transfer") {
              console.log("trans");
              //initiate transfer from sdk wallet to redeemer wallet
              try {
                const transfer = await useSDK.contractCasinoNFT.transfer(
                  address,
                  prize_token_id,
                  prize_token_qty
                );

                console.log("transferERC5511", transfer);
                const query3 = await db
                  .get_scrooge_usersDB()
                  .findOneAndUpdate(
                    { _id: ObjectId(user_id) },
                    { $inc: { ticket: -prize_price } }
                  );
                let getUserData = await db
                  .get_scrooge_usersDB()
                  .findOne({ _id: ObjectId(user_id) });
                //  console.log("getUserData",getUserData);

                const transactionPayload = {
                  amount: prize_price,
                  transactionType: "Badge Redeem",
                  prevWallet: getUserData?.wallet,
                  updatedWallet: getUserData?.wallet + prize_price,
                  userId: ObjectId(user_id),
                  updatedTicket: getUserData?.ticket - prize_price,
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
                  })
                  .catch((e) => {
                    console.log("e", e);
                  });
                postPrizeRedemption(prize_id, user_id);
                resp = prize_name;
                return res.status(200).send({ success: true, message: resp });
              } catch (error) {
                resp = "Transaction Failed";
                return res.send({ success: false, message: resp });
              }
            } else if (prize_redeem_action === "burn") {
              //initiate burn from sdk contract
              try {
                //const burn = await use_sdk.wallet.transfer(useSDK.BurnContractAddress, prize_token_qty, prize_contract);
                //const burn = await useSDK.contractCasinoNFT.burnTokens(prize_token_id, prize_token_qty);
                const query3 = await db
                  .get_scrooge_usersDB()
                  .findOneAndUpdate(
                    { _id: ObjectId(user_id) },
                    { $inc: { ticket: -prize_price } }
                  );
                postPrizeRedemption(prize_id, user_id);
                resp = prize_name;
                return res.status(200).send({ success: true, message: resp });
              } catch (error) {
                resp = "Transaction Failed";
                return res.send({ success: false, message: resp });
              }
            } else {
              // prize_redeem_action does not match any known redeem actions
              resp = "Invalid Prize Data";
              return res.send({ success: false, message: resp });
            }
          } else {
            //sdk wallet does not have enough balance to allow prize redemption
            //console.log("Balance unacceptable");
            console.log("else");
            resp = "Balance Unacceptable";
            console.log("resddp", resp);
            return res.send({ success: false, message: resp });
          }
        } else if (prize_token_type === "merch") {
          const markRedeemed = false;
          postPrizeRedemption(prize_id, user_id, coupon_code, markRedeemed);
          updateMerchClaimFlag(coupon_obj_id, user_id);
          const query3 = await db
            .get_scrooge_usersDB()
            .findOneAndUpdate(
              { _id: ObjectId(user_id) },
              { $inc: { ticket: -prize_price } }
            );
          let getUserData = await db
            .get_scrooge_usersDB()
            .findOne({ _id: ObjectId(user_id) });
          //  console.log("getUserData",getUserData);

          const transactionPayload = {
            amount: prize_price,
            transactionType: "Merch Redeem",
            prevWallet: getUserData?.wallet,
            updatedWallet: getUserData?.wallet + prize_price,
            userId: ObjectId(user_id),
            updatedTicket: getUserData?.ticket + prize_price,
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
            })
            .catch((e) => {
              console.log("e", e);
            });

          const getUserByID = await commons
            .getUserByUserID(user_id)
            .then((getUser) => {
              console.log("getUser", getUser, "CoupanCode", coupon_code);
              // const affEmailSend = email.sendemail(
              //   "merchEmail",
              //   getUser?.email,
              //   coupon_code
              // );
            });
          resp = prize_name;
          return res.status(200).send({ success: true, message: resp });
        } else if (prize_token_type === "erc721") {
          //start erc721 process
          //if there are no unclaimed NFTs in DL table, do not execute functions
          if (!DL_token_id) {
            //console.log("No DL NFTs available.");
            resp = "Prize Currently Unavailable";
            return res.send({ success: false, message: resp });
          } else {
            const sdk_wallet = await use_sdk.wallet.getAddress();
            console.log("sdk_wallet960", sdk_wallet);
            balanceRaw = await useSDK.contractDL.call("balanceOf", sdk_wallet);
            // balanceRaw = await use_sdk.wallet.balance(sdk_wallet);
            console.log("balanraw963", balanceRaw);
            balance = parseInt(balanceRaw);
            console.log("balan-----", balance);
            //console.log("getall", await useSDK.contractDL.erc721.getAll());
            // Verify sdk wallet / contract has enough balance to disburse prize
            if (balance && balance >= prize_token_qty) {
              //if (true) {
              //sdk wallet has enough balance to allow prize redemption
              //check for redeem_action from prize record
              if (prize_redeem_action === "transfer") {
                // console.log("transfet");
                //initiate transfer from sdk wallet to redeemer wallet
                try {
                  // const transfer = await use_sdk.wallet.transfer(
                  //   address,
                  //   prize_token_qty,
                  //   prize_contract
                  // );
                  const transfer = await useSDK.contractDL.call(
                    "safeTransferFrom",
                    sdk_wallet,
                    address,
                    DL_token_id
                  );
                  //update claim flag to true in ducky_lucks_prizes table
                  updateDLClaimFlag(DL_token_obj_id);
                  const query3 = await db
                    .get_scrooge_usersDB()
                    .findOneAndUpdate(
                      { _id: ObjectId(user_id) },
                      { $inc: { ticket: -prize_price } }
                    );
                  let getUserData = await db
                    .get_scrooge_usersDB()
                    .findOne({ _id: ObjectId(user_id) });
                  console.log("getUserData", getUserData);

                  const transactionPayload = {
                    amount: prize_price,
                    transactionType: "DL Redeem",
                    prevWallet: getUserData?.wallet,
                    updatedWallet: getUserData?.wallet - prize_price,
                    userId: ObjectId(user_id),
                    updatedTicket: getUserData?.ticket - prize_price,
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
                    })
                    .catch((e) => {
                      console.log("e", e);
                    });
                  postPrizeRedemption(prize_id, user_id);

                  resp = prize_name;
                  return res.status(200).send({ success: true, message: resp });
                } catch (error) {
                  console.log("Error", error);
                  resp = error?.reason || "Transaction Failed";
                  return res.send({ success: false, message: resp });
                }
              } else if (prize_redeem_action === "burn") {
                //initiate burn from sdk contract
                try {
                  //const burn = await useSDK.contractDL.call("burn", prize_token_id);
                  const query3 = await db
                    .get_scrooge_usersDB()
                    .findOneAndUpdate(
                      { _id: ObjectId(user_id) },
                      { $inc: { ticket: -prize_price } }
                    );
                  postPrizeRedemption(prize_id, user_id);
                  resp = prize_name;
                  return res.status(200).send({ success: true, message: resp });
                } catch (error) {
                  //console.log('Transaction Failed');
                  resp = "Transaction Failed";
                  return res.send({ success: false, message: resp });
                }
              } else {
                // prize_redeem_action does not match any known redeem actions
                resp = "Invalid Prize Data";
                return res.send({ success: false, message: resp });
              }
            } else {
              //sdk wallet does not have enough balance to allow prize redemption
              //console.log("Balance unacceptable");
              console.log("else721");
              resp = "Balance Unacceptable";
              return res.send({ success: false, message: resp });
            }
          }
        } else {
          //console.log("Prize token type not recognized.")
          resp = "Invalid Prize Data";
          return res.send({ success: false, message: resp });
        }
      } else {
        resp = "Not Enough Tickets";
        return res.send({ success: false, message: resp });
      }
    } else {
      res.send({ success: false, message: "Your kyc is not approved" });
    }
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function convertCryptoToGoldCoin(req, res) {
  const { userId, address, reciept, busd } = req.params;
  console.log("req.params", req?.params);
  console.log("reciept", reciept);
  console.log("cryptoToTokenadress", await useSDK.sdk_OG.wallet.getAddress());
  if (!reciept) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
  try {
    console.log("-----", db.get_marketplace_gcPackagesDB);
    const data = await db.get_marketplace_gcPackagesDB().findOne({
      priceInBUSD: busd + "",
    });
    console.log("dfdfdfdfdfdsf", data);
    const response = await addChips(
      userId,
      parseInt(data.freeTokenAmount),
      address,
      "Crypto To Gold Coin",
      parseInt(data.gcAmount)
    ).then(async (trans) => {
      console.log("transghghg123", trans);

      let getUserDetail = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(userId) });
      res.status(200).send({
        success: true,
        data: "Chips Added Successfully",
        user: getUserDetail,
      });
      //   } else {
      //     res
      //       .status(500)
      //       .send({ success: false, message: "Error in buying Process" });
      //   }
    });
  } catch (error) {
    console.log("cryptoToToken", error);
    res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function convertCryptoToToken(req, res) {
  const { userId, address, tokens, transactionHash } = req.params;
  console.log("transactionHash", transactionHash);

  // const recipients = await useSDK.sdk_OG.wallet.getAllRecipients();
  // const sdk = new ThirdwebSDK("https://bsc-dataseed4.binance.org/");

  //  console.log("recipients",sdk);
  console.log("req.params", req?.params);
  // let get= await useSDK.sdk_OG.wallet.getAddress()
  console.log("cryptoToTokenadress", await useSDK.sdk_OG.wallet.getAddress());
  try {
    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(userId) });
    //  console.log("getKycuser---->>>>",getKycuser);
    if (getKycuser?.status === "accept") {
      const response = await addChips(
        userId,
        parseInt(tokens),
        address,
        "Crypto To Token"
      ).then(async (trans) => {
        // console.log("transghghg123", trans);
        if (trans.code === 200) {
          // console.log("transghghg", trans);
          const commission = (0.05 * tokens).toFixed(0);
          // console.log("commission", commission);
          let findUserAff = await db
            .get_scrooge_usersDB()
            .findOne({ _id: ObjectId(userId) });
          // console.log("avvavavva", findUserAff);
          if (findUserAff?.refrenceId !== "false") {
            let comisData = {
              id: ObjectId(userId),
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
              { user_id: ObjectId(findUserAff?.refrenceId) },
              {
                $inc: { total_earned: parseInt(commission) },
                $set: { last_earned_at: new Date() },
              }
            );
            let getUserData = await db
              .get_scrooge_usersDB()
              .findOne({ _id: ObjectId(findUserAff?.refrenceId) });
            // console.log("getUserData---->>>>>>", getUserData);

            const transactionPayload = {
              amount: parseInt(commission),
              transactionType: "commission",
              prevWallet: getUserData?.wallet,
              updatedWallet: getUserData?.wallet + commission,
              userId: ObjectId(findUserAff?.refrenceId),
              updatedTicket: commission,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            let trans_id;
            // console.log("transactionPayload===>>>>", transactionPayload);
            await db
              .get_scrooge_transactionDB()
              .insertOne(transactionPayload)
              .then((trans) => {
                // console.log("transtranstrans", trans);
                trans_id = trans.insertedId;
              });
          }
          let getUserDetail = await db
            .get_scrooge_usersDB()
            .findOne({ _id: ObjectId(userId) });
          res.status(200).send({
            success: true,
            data: "Chips Added Successfully",
            user: getUserDetail,
          });
        } else {
          res
            .status(500)
            .send({ success: false, message: "Error in buying Process" });
        }
      });
    } else {
      res.send({ success: false, message: "Your kyc is not approved" });
    }
  } catch (error) {
    console.log("cryptoToToken", error);
    res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function convertPrice(req, res) {
  let resp;
  try {
    let userId = req.params.user_id;
    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(userId) });
    // console.log("getKycuser---->>>>",getKycuser);
    const { status } = getKycuser;
    if (getKycuser?.status === "accept") {
      // console.log("dbPrice",req.params.convertPrice);
      let ticket = parseInt(req.params.ticketPrice);
      let token = parseInt(req.params.tokenPrice);

      if (ticket >= 500) {
        const list = await db
          .get_scrooge_ticket_to_token()
          .findOne({ ticket: ticket.toString() });
        console.log("list", list);
        if (!list) {
          return res.send({
            code: 500,
            message: "Enter correct amount",
            data: "no data",
          });
        }
      }
      if (ticket < 10) {
        return res.send({
          code: 500,
          message: "Enter correct amount",
          data: "no data",
        });
      }

      let fData = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(userId) });
      if (!fData) {
        return res.send({
          code: 500,
          message: "User Not Found",
          data: "no data",
        });
      }
      if (fData?.ticket < ticket) {
        return res.send({
          code: 500,
          message: "You Don't Have Enough Tickets",
          data: "no data",
        });
      }
      await db
        .get_scrooge_usersDB()
        .findOneAndUpdate(
          { _id: ObjectId(userId) },
          { $inc: { ticket: -ticket, wallet: token } }
        );
      let getUserData = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(userId) });
      //  console.log("getUserData",getUserData);
      const transactionPayload = {
        amount: ticket,
        transactionType: "Ticket To Token",
        prevWallet: getUserData?.wallet,
        updatedWallet: getUserData?.wallet + ticket,
        userId: ObjectId(userId),
        updatedTicket: getUserData?.ticket - ticket,
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
        })
        .catch((e) => {
          console.log("e", e);
        });
      resp = "Succesfully converted";
      return res.send({ code: 200, message: resp, data: getUserData });
    } else {
      res.send({ success: false, message: "Your kyc is not approved" });
    }
  } catch (error) {
    console.log(error);
    resp = false;
  }
  return resp;
}

//   const query = db
//     .get_marketplace_prizesDB()
//     .findOne({ _id: ObjectId(prize_id) })
//     .then(async (prize) => {
//       console.log('prise', prize);
//       // assign prize attributes to variables
//       prize_name = prize.name; // price of selected prize in tickets
//       prize_price = prize.price; // price of selected prize in tickets
//       if (prize.isDynamic) {
//         //coupon_code = await getMerchCouponCode('JR', 'pr10off');
//         //console.log("post coupon code: ", coupon_code);
//         if (prize.contract === '0xfA1BA18067aC6884fB26e329e60273488a247FC3') {
//           console.log('OG');
//           curr_price = await getOGCurrentPrice();
//         } else if (
//           prize.contract === '0x2e9F79aF51dD1bb56Bbb1627FBe4Cc90aa8985Dd'
//         ) {
//           console.log('JR');
//           curr_price = await getJRCurrentPrice();
//         }
//         prize_token_qty = (prize_price / 100 / curr_price / 2).toFixed(0);
//       } else {
//         prize_token_qty = prize.token_qty; // quantity of tokens to be transferred upon redemption
//       }
//       prize_category = prize.category; // category of prize
//       console.log('cat', prize_category);
//       if (prize_category === 'Merch') {
//         store_id = prize.store_id;
//         discount_type = prize.discount_type;
//         coupon = await getMerchCouponCode(store_id, discount_type);
//         coupon_obj_id = coupon._id;
//         coupon_code = coupon.coupon_code;
//       }
//       prize_contract = prize.contract; // contract address of prize
//       prize_contract_name = prize.contract_name; // shorthand name for contract of prize
//       prize_token_type = prize.token_type; // token type (erc20/erc721/erc1155) of prize
//       prize_token_id = prize.token_id; // token_id of prize (null if erc20)
//       prize_redeem_action = prize.redeem_action; // action to execute redemption of prize
//       if (prize_name === 'Ducky Lucks NFT') {
//         const queryDL = await db
//           .get_marketplace_ducky_lucks_prizesDB()
//           .findOne({ claimed: false });
//         DL_token_id = queryDL.token_id;
//         DL_token_obj_id = queryDL._id;
//       }
//     })
//     .then(() => {
//       // get user record from users table by _id
//       const query2 = db
//         .get_scrooge_usersDB()
//         .findOne({ _id: ObjectId(user_id) })
//         .then((user) => {
//           //  console.log('user', user);
//           user_ticket = user.ticket; //user's available ticket balance
//           // verify user has more (or equal) tickets than price of prize
//           if (user_ticket >= prize_price) {
//             const query3 = db
//               .get_scrooge_usersDB()
//               .findOneAndUpdate(
//                 { _id: ObjectId(user_id) },
//                 { $inc: { ticket: -prize_price } }
//               )
//               .then(async (user) => {
//                 // Check for contract name to connect to from prize record
//                 if (prize_contract_name === 'OG') {
//                   use_sdk = useSDK.sdk_OG;
//                 } else if (prize_contract_name === 'JR') {
//                   use_sdk = useSDK.sdk_JR;
//                 } else if (prize_contract_name === 'Casino NFTS') {
//                   use_sdk = useSDK.sdk_casino_nfts;
//                 } else if (prize_contract_name === 'DL') {
//                   use_sdk = useSDK.sdk_DL;
//                 } else if (prize_category === 'Merch') {
//                   use_sdk = useSDK.sdk;
//                 } else {
//                   // prize_contract_name does not match any known contract names
//                   resp = 'Invalid Prize Data';
//                 }

//                 if (prize_token_type === 'erc20') {
//                   balanceRaw = await use_sdk.wallet.balance(prize_contract);
//                   balance = parseInt(balanceRaw.displayValue);
//                   //console.log('Balance: ',balance);
//                   // Verify sdk wallet / contract has enough balance to disburse prize
//                   if (balance && balance >= prize_token_qty) {
//                     //sdk wallet has enough balance to allow prize redemption
//                     //check for redeem_action from prize record
//                     if (prize_redeem_action === 'transfer') {
//                       //initiate transfer from sdk wallet to redeemer wallet
//                       try {
//                         //const transfer = await use_sdk.wallet.transfer(address, prize_token_qty, prize_contract);
//                         //console.log('Status: ', transfer.receipt.status);
//                         postPrizeRedemption(prize_id, user_id);
//                         resp = prize_name;
//                       } catch (error) {
//                         //console.log('Transaction Failed');
//                         resp = 'Transaction Failed';
//                       }
//                     } else if (prize_redeem_action === 'burn') {
//                       //initiate burn from sdk wallet
//                       try {
//                         //const burn = await use_sdk.wallet.transfer(useSDK.BurnContractAddress, prize_token_qty, prize_contract);
//                         //console.log('Status: ', transfer.receipt.status);
//                         postPrizeRedemption(prize_id, user_id);
//                         resp = prize_name;
//                       } catch (error) {
//                         //console.log('Transaction Failed');
//                         resp = 'Transaction Failed';
//                       }
//                     } else {
//                       // prize_redeem_action does not match any known redeem actions
//                       resp = 'Invalid Prize Data';
//                     }
//                   } else {
//                     //sdk wallet does not have enough balance to allow prize redemption
//                     //console.log("Balance unacceptable");
//                     resp = 'Balance Unacceptable';
//                   }
//                 } else if (prize_token_type === 'erc1155') {
//                   //start erc1155 process

//                   const sdk_wallet = await use_sdk.wallet.getAddress();
//                   console.log(sdk_wallet);
//                   balanceRaw = await useSDK.contractCasinoNFT.balanceOf(
//                     sdk_wallet,
//                     prize_token_id
//                   );
//                   console.log('balraw', balanceRaw);
//                   balance = parseInt(balanceRaw);
//                   // Verify sdk wallet / contract has enough balance to disburse prize
//                   console.log('balance', balance);
//                   if (balance && balance >= prize_token_qty) {
//                     //sdk wallet has enough balance to allow prize redemption
//                     //check for redeem_action from prize record
//                     if (prize_redeem_action === 'transfer') {
//                       console.log('trans');
//                       //initiate transfer from sdk wallet to redeemer wallet
//                       try {
//                         const transfer =
//                           await useSDK.contractCasinoNFT.transfer(
//                             address,
//                             prize_token_id,
//                             prize_token_qty
//                           );
//                         postPrizeRedemption(prize_id, user_id);
//                         resp = prize_name;
//                       } catch (error) {
//                         resp = 'Transaction Failed';
//                       }
//                     } else if (prize_redeem_action === 'burn') {
//                       //initiate burn from sdk contract
//                       try {
//                         //const burn = await use_sdk.wallet.transfer(useSDK.BurnContractAddress, prize_token_qty, prize_contract);
//                         //const burn = await useSDK.contractCasinoNFT.burnTokens(prize_token_id, prize_token_qty);
//                         postPrizeRedemption(prize_id, user_id);
//                         resp = prize_name;
//                       } catch (error) {
//                         resp = 'Transaction Failed';
//                       }
//                     } else {
//                       // prize_redeem_action does not match any known redeem actions
//                       resp = 'Invalid Prize Data';
//                     }
//                   } else {
//                     //sdk wallet does not have enough balance to allow prize redemption
//                     //console.log("Balance unacceptable");
//                     console.log('else');
//                     resp = 'Balance Unacceptable';
//                     console.log('resddp', resp);
//                     return resp;
//                   }
//                 } else if (prize_token_type === 'merch') {
//                   const markRedeemed = false;
//                   postPrizeRedemption(
//                     prize_id,
//                     user_id,
//                     coupon_code,
//                     markRedeemed
//                   );
//                   updateMerchClaimFlag(coupon_obj_id, user_id);
//                   const getUserByID = await commons
//                     .getUserByUserID(user_id)
//                     .then((getUser) => {
//                       const affEmailSend = email.sendemail(
//                         'merchEmail',
//                         getUser.email,
//                         coupon_code
//                       );
//                     });
//                   resp = prize_name;
//                 } else if (prize_token_type === 'erc721') {
//                   //start erc721 process
//                   //if there are no unclaimed NFTs in DL table, do not execute functions
//                   if (!DL_token_id) {
//                     //console.log("No DL NFTs available.");
//                     resp = 'Prize Currently Unavailable';
//                   } else {
//                     const sdk_wallet = await use_sdk.wallet.getAddress();
//                     balanceRaw = await useSDK.contractDL.call(
//                       'balanceOf',
//                       sdk_wallet
//                     );
//                     balance = parseInt(balanceRaw);
//                     // Verify sdk wallet / contract has enough balance to disburse prize
//                     if (balance && balance >= prize_token_qty) {
//                       //sdk wallet has enough balance to allow prize redemption
//                       //check for redeem_action from prize record
//                       if (prize_redeem_action === 'transfer') {
//                         //initiate transfer from sdk wallet to redeemer wallet
//                         try {
//                           //const transfer = await useSDK.contractDL.call("safeTransferFrom", sdk_wallet, address, DL_token_id);
//                           //update claim flag to true in ducky_lucks_prizes table
//                           updateDLClaimFlag(DL_token_obj_id);
//                           postPrizeRedemption(prize_id, user_id);
//                           resp = prize_name;
//                         } catch (error) {
//                           console.log('Error');
//                           resp = 'Transaction Failed';
//                         }
//                       } else if (prize_redeem_action === 'burn') {
//                         //initiate burn from sdk contract
//                         try {
//                           //const burn = await useSDK.contractDL.call("burn", prize_token_id);
//                           postPrizeRedemption(prize_id, user_id);
//                           resp = prize_name;
//                         } catch (error) {
//                           //console.log('Transaction Failed');
//                           resp = 'Transaction Failed';
//                         }
//                       } else {
//                         // prize_redeem_action does not match any known redeem actions
//                         resp = 'Invalid Prize Data';
//                       }
//                     } else {
//                       //sdk wallet does not have enough balance to allow prize redemption
//                       //console.log("Balance unacceptable");
//                       resp = 'Balance Unacceptable';
//                     }
//                   }
//                 } else {
//                   //console.log("Prize token type not recognized.")
//                   resp = 'Invalid Prize Data';
//                 }
//               });
//           } else {
//             //console.log("User does not have enough tickets.");
//             resp = 'Not Enough Tickets';
//           }
//         })
//         .catch((e) => {
//           console.log('error', e);
//         });
//     });
