import * as db from "./mongodb.mjs";
import * as useSDK from "./sdk.mjs";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { BigNumber, ethers, logger } from "ethers";

import * as emailSend from "../email/emailSend.mjs";
import * as commons from "./commons.mjs";
import { ObjectId } from "mongodb";
import itemModel from "../models/itemModel.mjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import OG_ABI from "../config/OG_ABI.json" assert { type: "json" };
import JR_ABI from "../config/JR_ABI.json" assert { type: "json" };
import BNB_ABI from "../config/BNB_ABI.json" assert { type: "json" };
import { sendInvoice } from "../utils/sendx_send_invoice.mjs";
import { getSigner } from "../utils/signer.mjs";
import Queue from "better-queue";
import { getAnAcceptPaymentPage, getToken } from "../utils/payment.mjs";
import { compareArrays } from "./utilities.mjs";
import axios from "axios";
import moment from "moment";

const { Schema } = mongoose;

dotenv.config();

const pids = {
  6: 5,
  11.5884: 9.99,
  12: 10,
  29: 25,
  58: 50,
  116: 100,
  290: 250,
};

const jrAddress = process.env.JR_WALLET_ADDRESS.toLowerCase();
const ogAddress = process.env.OG_WALLET_ADDRESS.toLowerCase();
const busdAddress = process.env.BUSD_WALLET_ADDRESS.toLowerCase();
const jrContractAddress = process.env.JR_CONTRACT_ADDRESS.toLowerCase();
const ogContractAddress = process.env.OG_CONTRACT_ADDRESS.toLowerCase();
const bnbContractAddress = process.env.BNB_CONTRACT_ADDRESS.toLowerCase();

export async function addChips(
  _user_id,
  _qty,
  _address,
  transactionType,
  gc = 0,
  recipt = {},
  bonusToken,
  prchAmt
) {
  console.log("bonusToken", bonusToken);
  const multiplier = getRolloverMultiplier(Math.floor(prchAmt));
  try {
    let query = {};
    // For Rollover
    if (transactionType === "Monthly Reward Claim") {
      query = {
        goldCoin: gc,
        wallet: _qty,
        monthlyClaimBonus: _qty,
        nonWithdrawableAmt: _qty,
      };
    } else {
      console.log("prchAmt", Math.floor(prchAmt));

      if (prchAmt > 10) {
        query = {
          goldCoin: gc,
          wallet: _qty,
          dailySpinBonus: _qty - bonusToken,
          nonWithdrawableAmt: _qty,
          monthlyClaimBonus: bonusToken,
        };
      } else {
        query = {
          goldCoin: gc,
          wallet: _qty,
          dailySpinBonus: _qty,
          nonWithdrawableAmt: _qty,
          // monthlyClaimBonus: bonusToken,
        };
      }
    }
    console.log("query", query);
    const { value: user } = await db.get_scrooge_usersDB().findOneAndUpdate(
      { _id: ObjectId(_user_id) },
      {
        $inc: query,
      },
      { new: true }
    );
    if (bonusToken > 0) {
      const exprDate = new Date();
      exprDate.setHours(24 * 30 + exprDate.getHours());
      exprDate.setSeconds(0);
      exprDate.setMilliseconds(0);

      await db.get_scrooge_bonus().insert({
        userId: ObjectId(_user_id),
        bonusType: "monthly",
        bonusAmount: bonusToken,
        bonusExpirationTime: exprDate,
        wagerLimit: bonusToken * multiplier,
        rollOverTimes: multiplier,
        createdAt: new Date(),
        updatedAt: new Date(),
        isExpired: false,
        wageredAmount: 0,
        subCategory: "Promo Bonus",
        restAmount: bonusToken,
        expiredAmount: bonusToken,
        executing: false,
      });
    }
    await db.get_marketplace_chip_transactionsDB().insertOne({
      user_id: ObjectId(_user_id),
      address: _address,
      chips: _qty,
      timestamp: new Date(),
    });
    if (user) {
      const { _id, username, email, firstName, lastName, profile, ipAddress } =
        user;
      const transactionPayload = {
        amount: gc ? gc : _qty,
        transactionType: transactionType,
        prevWallet: user.wallet,
        updatedWallet: user.wallet + _qty,
        userId: {
          _id,
          username,
          email,
          firstName,
          lastName,
          profile,
          ipAddress,
        },

        address: _address,
        updatedTicket: user.ticket,
        prevGoldCoin: user.goldCoin,
        updatedGoldCoin: user.goldCoin + gc,
        createdAt: new Date(),
        updatedAt: new Date(),
        transactionDetails: recipt,
        prevTicket: user.ticket,
        purchasedAmountInUSD: parseFloat(prchAmt),
        purchasedToken: _qty,
      };
      const trans_id = await db
        .get_scrooge_transactionDB()
        .insertOne(transactionPayload);

      // For RollOver

      if (transactionType === "Monthly Reward Claim") {
        const exprDate = new Date();
        exprDate.setHours(24 * 30 + exprDate.getHours());
        exprDate.setSeconds(0);
        exprDate.setMilliseconds(0);

        await db.get_scrooge_bonus().insert({
          userId: ObjectId(_user_id),
          bonusType: "monthly",
          bonusAmount: _qty,
          bonusExpirationTime: exprDate,
          wagerLimit: _qty * 30,
          rollOverTimes: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpired: false,
          wageredAmount: 0,
          subCategory: "Monthly",
          restAmount: bonusToken,
          expiredAmount: bonusToken,
          executing: false,
        });
      }

      // const transPayload = {
      //   amount: _qty,
      //   transactionType: "Free Tokens",
      //   prevWallet: getUserData?.wallet + _qty,
      //   updatedWallet: getUserData?.wallet + _qty,
      //   userId: ObjectId(_user_id),
      //   updatedTicket: getUserData?.ticket,
      //   prevGoldCoin: getUserData?.goldCoin,
      //   updatedGoldCoin: getUserData?.goldCoin,
      //   createdAt: new Date(),
      //   updatedAt: new Date(),
      //   prevTicket: getUserData?.ticket,

      // };
      // await db
      //   .get_scrooge_transactionDB()
      //   .insertOne(transPayload)
      //   .then((trans) => {
      //     trans_id = trans.insertedId;
      //   });
    }
    return { code: 200, message: " token buy success" };
  } catch (error) {
    console.log("errrr", error);
    return { code: 400, message: "token buy faild" };
  }
}

const getRolloverMultiplier = (prchAmt) => {
  if (Math.floor(prchAmt) === 25) {
    return 4;
  } else if (Math.floor(prchAmt) == 50) {
    return 6;
  } else if (Math.floor(prchAmt) == 100) {
    return 10;
  } else {
    return 1;
  }
};

export async function getNextClaimDate(req, res) {
  let resp;
  const { address, type, user_id, token_id } = req.params;
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
    if (typeof data[0] !== "undefined") {
      if (type === "daily") {
        lastClaimDate = data[0].claimDate;
        nextClaimDate = new Date(data[0].claimDate);
        nextClaimDate.setDate(nextClaimDate.getDate() + 1);
        data[0].nextClaimDate = nextClaimDate;
        if (typeof nextClaimDate != "undefined") {
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
    const checkOwner = await useSDK.contractDL.call("ownerOf", [token_id]);
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
          if (lastClaimDate >= prevmonth) {
            isClaimable = true;
          } else {
            isClaimable = false;
          }
        } else {
          isClaimable = true;
        }
        if (isClaimable) {
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
              const chipsAdded = await addChips(
                user_id,
                parseInt(qty),
                address,
                "DL Token Claim"
              ).then(() => {
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
    }
    if (typeof lastClaimDate != "undefined") {
      if (lastClaimDate.getTime() <= prevday.getTime()) {
        isClaimable = true;
        if (lastClaimDate.getTime() >= consecutiveDate.getTime()) {
          isConsecutive = true;
          consecutive_days = data[0].consecutive_days + 1;
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
        isClaimable = false;
      }
    } else {
      isClaimable = true;
    }
    if (isClaimable) {
      const queryCT = await db
        .get_marketplace_daily_reward_token_claimsDB()
        .insertOne({
          user_id: user_id,
          qty: qty,
          claimDate: new Date(),
          consecutive_days: consecutive_days,
        })
        .then(async (trans) => {
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
      resp = {
        success: false,
        message: "ZERO! You are not allowed to claim yet.",
      };
    }
  });

  return resp;
}

// Route to claim holder monthly Tokens
export async function claimHolderTokens(req) {
  let resp;
  const user = req.user;
  const address = req.params.address;
  const balBigNUm = await useSDK.contractOG.call("balanceOf", [address]);
  const bal = Number(ethers.utils.formatEther(balBigNUm));
  if (user?.isBlockWallet) {
    return (resp = { msg: "Your wallet blocked by admin.", code: 400 });
  }

  const res = await fetch(`https://api.coinbrain.com/public/coin-info`, {
    method: "post",
    body: JSON.stringify({
      56: [process.env.OG_CONTRACT_ADDRESS],
    }),
  });
  const data = await res.json();
  const current_price = data[0].priceUsd;
  let isClaimable = false,
    prevmonth,
    OGValue,
    lastClaimDate;

  console.log("req.params", req.params);
  const isValid = await getSigner(req.params);
  console.log("datata", isValid);
  if (!isValid) {
    return (resp = { msg: "Invalid signer", code: 400 });
  }

  let query = {
    transactionType: "Monthly Reward Claim",
    "userId._id": user._id,
  };
  const options = {
    sort: { _id: -1 },
    limit: 1,
  };

  const getLastetMonthyTransaction = await db
    .get_scrooge_transactionDB()
    .findOne(query, options);
  if (!getLastetMonthyTransaction) {
    if (address && user._id && bal && current_price) {
      let OGValueIn = (current_price * bal).toFixed(0);
      if (OGValueIn < 50) {
        return (resp = { msg: "You don't have enough OG coins.", code: 400 });
      } else if (OGValueIn > 3000) {
        OGValue = 3000;
      } else {
        OGValue = OGValueIn;
      }
      resp = { data: OGValue, code: 200 };
      if (OGValue > 0) {
        const qry = { address };
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
              isClaimable = true;
            } else {
              isClaimable = false;
            }
          } else {
            isClaimable = true;
          }
          if (isClaimable) {
            const queryCT = await db
              .get_marketplace_holder_claim_chips_transactionsDB()
              .insertOne({
                address: address,
                user_id: user._id.toString(),
                qty: parseInt(OGValue),
                claimDate: new Date(),
                nextClaimDate: nextmonth,
              })
              .then(async (trans) => {
                const chipsAdded = await addChips(
                  user._id.toString(),
                  parseInt(OGValue),
                  address,
                  "Monthly Reward Claim"
                ).then((data) => {
                  resp = { data: OGValue, code: 200 };
                });
              });
          } else {
            resp = {
              msg: "ZERO! You are not allowed to claim yet.",
              code: 400,
            };
          }
        });
      } else {
        resp = {
          msg: "ZERO! You do not hold enough Scrooge Coin crypto.",
          code: 400,
        };
      }

      return resp;
    }
  }
  const { createdAt } = getLastetMonthyTransaction;
  console.log("createdAt", createdAt);
  const currentDate = new Date(createdAt);
  const currentDay = currentDate.getDate();
  currentDate.setMonth(currentDate.getMonth() + 1);

  if (currentDate.getDate() < currentDay) {
    currentDate.setDate(0);
  }
  console.log("claimDtae", currentDate);
  if (currentDate > new Date()) {
    return (resp = { msg: "You can cliam Only one in a month", code: 400 });
  }

  // const res = await fetch(
  //   `https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/${ogContractAddress}`
  // );

  if (address && user._id && bal && current_price) {
    let OGValueIn = (current_price * bal).toFixed(0);
    if (OGValueIn < 50) {
      return (resp = { msg: "You don't have enough OG coins.", code: 400 });
    } else if (OGValueIn > 3000) {
      OGValue = 3000;
    } else {
      OGValue = OGValueIn;
    }
    resp = { data: OGValue, code: 200 };
    if (OGValue > 0) {
      const qry = { address };
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
            isClaimable = true;
          } else {
            isClaimable = false;
          }
        } else {
          isClaimable = true;
        }
        if (isClaimable) {
          const queryCT = await db
            .get_marketplace_holder_claim_chips_transactionsDB()
            .insertOne({
              address: address,
              user_id: user._id.toString(),
              qty: parseInt(OGValue),
              claimDate: new Date(),
              nextClaimDate: nextmonth,
            })
            .then(async (trans) => {
              const chipsAdded = await addChips(
                user._id.toString(),
                parseInt(OGValue),
                address,
                "Monthly Reward Claim"
              ).then((data) => {
                resp = { data: OGValue, code: 200 };
              });
            });
        } else {
          resp = {
            msg: "ZERO! You are not allowed to claim yet.",
            code: 400,
          };
        }
      });
    } else {
      resp = {
        msg: "ZERO! You do not hold enough Scrooge Coin crypto.",
        code: 400,
      };
    }

    return resp;
  }
}

export async function getCryptoToGCPackages(req, res) {
  const qry = {};
  let averageValue = 0;
  const sort = { price: 1 };
  const megaOffer = req?.user?.megaOffer;
  console.log("megaOffer", megaOffer);
  let arr = [9.99, 19.99, 24.99];
  let isMatch = compareArrays(megaOffer, arr);
  console.log("isMatch", isMatch);

  if (isMatch) {
    const tranCount = db.get_scrooge_transactionDB().find({
      "userId._id": ObjectId(req?.user?._id),
      transactionType: "CC To Gold Coin",
      purchasedAmountInUSD: { $nin: megaOffer },
    });
    const dr = await tranCount.toArray();
    // console.log("tran", dr);
    let totalPurchasedAmountInUSD = 0;
    dr.forEach((transaction) => {
      totalPurchasedAmountInUSD += transaction.purchasedAmountInUSD;
    });
    averageValue = totalPurchasedAmountInUSD / dr.length;
    let resp;
    const cursor = db.get_marketplace_gcPackagesDB().find(qry).sort(sort);

    await cursor.toArray().then((allPackages) => {
      resp = { allPackages, averageValue };
    });

    return res.send(resp);
  } else {
    let resp;
    const cursor = db.get_marketplace_gcPackagesDB().find(qry).sort(sort);

    await cursor.toArray().then((allPackages) => {
      resp = { allPackages };
    });
    return res.send(resp);
  }
}

export async function getTicketToToken(req, res) {
  const qry = {};
  const sort = { price: 1 };
  let resp;
  const cursor = db.get_scrooge_ticket_to_token().find(qry).sort(sort);

  const arr = await cursor.toArray().then((data) => {
    resp = data;
  });
  return res.send(resp);
}

export async function getPrizes(req) {
  const qry = {};
  const sort = { price: 1 };
  let resp;
  const cursor = db.get_marketplace_prizesDB().find(qry).sort(sort);
  const data = [{ contract: "hghhh", price: 70 }];
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
  let resp;
  let trans_id;
  const withdraw_id = req.params.withdraw_id;
  const transactionHash = req.params.transactionHash;
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
    let recipt = await useSDK.sdk.getProvider().getTransaction(transactionHash);
    console.log("getOGCurrentPrice", recipt);
    const { hash, from } = recipt;
    const query = await db
      .get_db_withdraw_requestDB()
      .findOne({ _id: ObjectId(withdraw_id) });
    const user_id = query.userId;
    const address = query.address;
    const prize_id = query.redeemId;

    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(user_id) });
    if (getKycuser?.status === "accept") {
      const prize = await db
        .get_marketplace_prizesDB()
        .findOne({ _id: ObjectId(prize_id) });
      // assign prize attributes to variables
      prize_name = prize.name; // price of selected prize in tickets
      prize_price = prize.price; // price of selected prize in tickets
      if (prize.isDynamic) {
        if (prize.contract === "0x9DfeE72aEa65dc7e375d50Ea2Bd90384313A165A") {
          // console.log("OG");
          curr_price = await useSDK.getOGCurrentPrice();
        } else if (
          prize.contract === "0x2e9F79aF51dD1bb56Bbb1627FBe4Cc90aa8985Dd"
        ) {
          // console.log("JR");
          curr_price = await useSDK.getJRCurrentPrice();
        }
        prize_token_qty = (prize_price / 100 / curr_price).toFixed(0);
        // console.log("prize_token_qty", prize_token_qty);
      } else {
        prize_token_qty = prize.token_qty;
        // console.log("prize_token_qty2", prize_token_qty); // quantity of tokens to be transferred upon redemption
      }
      prize_category = prize.category; // category of prize
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

        DL_token_id = queryDL?.token_id;
        DL_token_obj_id = queryDL._id;
      }

      // get user record from users table by _id
      const user = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(user_id) });

      user_ticket = user.ticket; //user's available ticket balance
      // verify user has more (or equal) tickets than price of prize
      if (prize_contract_name === "OG") {
        use_sdk = useSDK.sdk_OG;
      } else if (prize_contract_name === "JR") {
        console.log("JRRRRR");
        use_sdk = useSDK.sdk_JR;
      } else if (prize_contract_name === "Casino NFTS") {
        use_sdk = useSDK.sdk_casino_nfts;
      } else if (prize_contract_name === "DL") {
        use_sdk = useSDK.sdk_DL;
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

        // Verify sdk wallet / contract has enough balance to disburse prize
        prize_token_qty = prize_token_qty - prize_token_qty * 0.01;
        if (true) {
          //sdk wallet has enough balance to allow prize redemption
          //check for redeem_action from prize record
          if (prize_redeem_action === "transfer") {
            //initiate transfer from sdk wallet to redeemer wallet
            try {
              // const transfer = await use_sdk.wallet.transfer(
              //   address,
              //   prize_token_qty,
              //   prize_contract
              // );
              await db.get_db_withdraw_requestDB().findOneAndUpdate(
                { _id: ObjectId(withdraw_id) },
                {
                  $set: {
                    status: "Approved",
                    transactionHash: transactionHash,
                  },
                }
              );
              await db.get_scrooge_usersDB().findOneAndUpdate(
                { _id: ObjectId(user_id) },
                {
                  $inc: {
                    totalProfit: -prize?.price / 100,
                    totalRedeem: prize?.price / 100,
                  },
                }
              );

              // const query3 = await db
              //   .get_scrooge_usersDB()
              //   .findOneAndUpdate(
              //     { _id: ObjectId(user_id) },
              //     { $inc: { ticket: -prize_price } }
              //   );
              let getUserData = await db
                .get_scrooge_usersDB()
                .findOne({ _id: ObjectId(user_id) });
              const {
                _id,
                username,
                email,
                firstName,
                lastName,
                profile,
                ipAddress,
                ref,
              } = getUserData;
              const transactionPayload = {
                amount: prize_price,
                transactionType: "Approve Crypto Redeem",
                prevWallet: getUserData?.wallet + parseInt(prize_price),
                updatedWallet: getUserData?.wallet,
                userId: {
                  _id,
                  username,
                  email,
                  firstName,
                  lastName,
                  profile,
                  ipAddress,
                  // refrenceId,
                },
                // updatedTicket: getUserData?.ticket,

                updatedGoldCoin: getUserData?.goldCoin,
                prevGoldCoin: getUserData?.goldCoin,
                transactionDetails: {
                  transactionHash: transactionHash,
                },
                // prevTicket: getUserData?.ticket + parseInt(prize_price),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              let trans_id;
              await db
                .get_scrooge_transactionDB()
                .insertOne(transactionPayload)
                .then((trans) => {
                  trans_id = trans.insertedId;
                })
                .catch((e) => {
                  console.log("e", e);
                });
              emailSend.ApproveRedeemRequestEmail(
                email,
                prize_price,
                username,
                hash,
                from
              );

              if (refrenceId) {
                let getUserdetails = await db
                  .get_scrooge_usersDB()
                  .findOne({ _id: ObjectId(user_id) });
                let affliateUserDetails = {
                  userId: user_id,
                  transactionType: "Approve Crypto Redeem",
                  redeemAmount: parseInt(prize_price / 100),
                  tokenAmount: getUserdetails?.wallet,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                await db
                  .get_db_affiliates_transactionDB()
                  .insertOne(affliateUserDetails);
              }

              postPrizeRedemption(prize_id, user_id);
              resp = prize_name;
              return res.status(200).send({ success: true, message: resp });
            } catch (error) {
              console.log("error---", error);
              resp = error?.reason || "Transaction Failed";
              // resp = "Transaction Failed";
              return res.send({ success: false, message: resp });
            }
          } else if (prize_redeem_action === "burn") {
            //initiate burn from sdk wallet
            try {
              //const burn = await use_sdk.wallet.transfer(useSDK.BurnContractAddress, prize_token_qty, prize_contract);
              // const query3 = await db
              //   .get_scrooge_usersDB()
              //   .findOneAndUpdate(
              //     { _id: ObjectId(user_id) },
              //     { $inc: { ticket: -prize_price } }
              //   );
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
        // balanceRaw = await use_sdk.wallet.balance(sdk_wallet);
        // balanceRaw = await useSDK.contractCasinoNFT.erc1155.balanceOf(
        //   sdk_wallet,
        //   [prize_token_id]
        // );
        // console.log("balraw", balanceRaw);

        balance = parseInt(balanceRaw);
        // Verify sdk wallet / contract has enough balance to disburse prize

        if (balance && balance >= prize_token_qty) {
          //sdk wallet has enough balance to allow prize redemption
          //check for redeem_action from prize record
          if (prize_redeem_action === "transfer") {
            //initiate transfer from sdk wallet to redeemer wallet
            try {
              // const transfer = await useSDK.contractCasinoNFT.transfer(
              //   address,
              //   prize_token_id,
              //   prize_token_qty
              // );

              // console.log("transferERC5511", transfer);
              // const query3 = await db
              //   .get_scrooge_usersDB()
              //   .findOneAndUpdate(
              //     { _id: ObjectId(user_id) },
              //     { $inc: { ticket: -prize_price } }
              //   );
              // let getUserData = await db
              //   .get_scrooge_usersDB()
              //   .findOne({ _id: ObjectId(user_id) });
              //  console.log("getUserData",getUserData);

              // const transactionPayload = {
              //   amount: prize_price,
              //   transactionType: "Badge Redeem",
              //   prevWallet: getUserData?.wallet,
              //   updatedWallet: getUserData?.wallet + prize_price,
              //   userId: ObjectId(user_id),
              //   updatedTicket: getUserData?.ticket - prize_price,
              //   updatedGoldCoin: getUserData?.goldCoin,
              //   prevGoldCoin: getUserData?.goldCoin,
              //   prevTicket: getUserData?.ticket,
              //   createdAt: new Date(),
              //   updatedAt: new Date(),
              // };
              // let trans_id;
              // console.log("transactionPayload", transactionPayload);
              // await db
              //   .get_scrooge_transactionDB()
              //   .insertOne(transactionPayload)
              //   .then((trans) => {
              //     console.log("transtranstrans", trans);
              //     trans_id = trans.insertedId;
              //   })
              //   .catch((e) => {
              //     console.log("e", e);
              //   });
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
          resp = "Balance Unacceptable";
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
        const {
          _id,
          username,
          email,
          firstName,
          lastName,
          profile,
          ipAddress,
        } = getUserData;

        const transactionPayload = {
          amount: prize_price,
          transactionType: "Merch Redeem",
          prevWallet: getUserData?.wallet,
          updatedWallet: getUserData?.wallet + prize_price,
          userId: {
            _id,
            username,
            email,
            firstName,
            lastName,
            profile,
            ipAddress,
          },
          ipAddress,
          updatedTicket: getUserData?.ticket + prize_price,
          updatedGoldCoin: getUserData?.goldCoin,
          prevGoldCoin: getUserData?.goldCoin,
          prevTicket: getUserData?.ticket,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        let trans_id;
        await db
          .get_scrooge_transactionDB()
          .insertOne(transactionPayload)
          .then((trans) => {
            trans_id = trans.insertedId;
          })
          .catch((e) => {
            console.log("e", e);
          });

        const getUserByID = await commons
          .getUserByUserID(user_id)
          .then((getUser) => {
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
          resp = "Prize Currently Unavailable";
          return res.send({ success: false, message: resp });
        } else {
          const sdk_wallet = await use_sdk.wallet.getAddress();
          balanceRaw = await useSDK.contractDL.call("balanceOf", [sdk_wallet]);
          // balanceRaw = await use_sdk.wallet.balance(sdk_wallet);
          balance = parseInt(balanceRaw);
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
                  [sdk_wallet, address, DL_token_id],
                  {
                    gasPrice: ethers.utils.parseUnits("1", "gwei"),
                    gasLimit: 1000000,
                  }
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
                const {
                  _id,
                  username,
                  email,
                  firstName,
                  lastName,
                  profile,
                  ipAddress,
                } = getUserData;

                const transactionPayload = {
                  amount: prize_price,
                  transactionType: "DL Redeem",
                  prevWallet: getUserData?.wallet,
                  updatedWallet: getUserData?.wallet - prize_price,
                  userId: {
                    _id,
                    username,
                    email,
                    firstName,
                    lastName,
                    profile,
                    ipAddress,
                  },

                  updatedTicket: getUserData?.ticket - prize_price,
                  updatedGoldCoin: getUserData?.goldCoin,
                  prevGoldCoin: getUserData?.goldCoin,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  prevTicket: getUserData?.ticket,
                };
                let trans_id;
                await db
                  .get_scrooge_transactionDB()
                  .insertOne(transactionPayload)
                  .then((trans) => {
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
      res.send({ success: false, message: "Your kyc is not approved" });
    }
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

const getDecodedData = async (recipt) => {
  try {
    let iface, contractAddresss;

    console.log("bnbContractAddress", bnbContractAddress);

    if (recipt.to.toLowerCase() === jrContractAddress) {
      //  console.log("JR ")
      iface = new ethers.utils.Interface(JR_ABI);
      contractAddresss = process.env.JR_CONTRACT_ADDRESS;
    } else if (recipt.to.toLowerCase() === ogContractAddress) {
      //  console.log("OG")
      iface = new ethers.utils.Interface(OG_ABI);
      contractAddresss = process.env.OG_CONTRACT_ADDRESS;
    } else {
      iface = new ethers.utils.Interface(BNB_ABI);
      contractAddresss = process.env.BNB_CONTRACT_ADDRESS;
    }
    let decoded;
    if (recipt.data.length > 2) {
      decoded = iface.parseTransaction({ data: recipt.data });
    }

    const cryptoAmt =
      decoded && decoded.args["wad"]
        ? Number(ethers.utils.formatEther(decoded.args["wad"]))
        : decoded && decoded.args["amount"]
        ? Number(ethers.utils.formatEther(decoded.args["amount"]))
        : Number(ethers.utils.formatEther(recipt.value));
    console.log("cryptoAmtcryptoAmt===>>>", cryptoAmt);
    console.log("reciptrecipt", recipt);
    if (
      recipt.to.toLowerCase() ===
      "0x" + process.env.BUSD_WALLET_ADDRESS.toLowerCase()
    ) {
      // const res = await fetch(
      //   `https://api.coinbrain.com/public/coin-info/${contractAddresss}`
      // );
      const res = await fetch(`https://api.coinbrain.com/public/coin-info`, {
        method: "post",
        body: JSON.stringify({
          56: [contractAddresss],
        }),
      });
      const data = await res.json();
      const current_price = data[0].priceUsd;
      const cryptoUsd = cryptoAmt * current_price;
      console.log("cryptoUsd1286", cryptoUsd);
      console.log("Math.round(cryptoUsd", Math.round(cryptoUsd));
      console.log("pids[Math.round(cryptoUsd)]", pids[Math.round(cryptoUsd)]);
      if (
        recipt.to.toLowerCase() ===
        "0x" + process.env.BUSD_WALLET_ADDRESS.toLowerCase()
      ) {
        if (cryptoUsd === 11.5884) {
          return 9.99;
        }
        if (cryptoUsd === 23.1884) {
          return 19.99;
        }
        return parseInt(Math.round(cryptoUsd));
      }

      return pids[Math.round(cryptoUsd)];
    } else if (recipt.to.toLowerCase() === ogContractAddress) {
      const res = await fetch(`https://api.coinbrain.com/public/coin-info`, {
        method: "post",
        body: JSON.stringify({
          56: [process.env.OG_CONTRACT_ADDRESS],
        }),
      });
      const data = await res.json();
      const current_price = data[0].priceUsd;
      const cryptoUsd = cryptoAmt * current_price;
      if (
        recipt.to.toLowerCase() ===
        "0x" + process.env.BUSD_WALLET_ADDRESS.toLowerCase()
      ) {
        return parseInt(cryptoUsd);
      }

      console.log("cryptoUsd", cryptoUsd);
      console.log("Math.round(cryptoUsd", Math.round(cryptoUsd));
      console.log("pids[Math.round(cryptoUsd)]", pids[Math.round(cryptoUsd)]);
      if (cryptoUsd === 11.5884) {
        return 9.99;
      }
      if (cryptoUsd === 23.1884) {
        return 19.99;
      }
      return pids[Math.round(cryptoUsd)];
    }
    return cryptoAmt;
  } catch (error) {
    console.log("error", error);
  }
};

export async function convertCryptoToGoldCoin(req, res) {
  const { address, transactionHash } = req.params;
  const { promoCode, usd } = req.query;
  const {
    user: {
      _id: userId,
      refrenceId,
      username,
      email,
      firstName,
      lastName,
      profile,
      isBlockWallet,
    },
  } = req;
  try {
    if (isBlockWallet) {
      return res
        .status(400)
        .send({ success: false, data: "Your wallet blocked by admin" });
    }

    let recipt = await useSDK.sdk.getProvider().getTransaction(transactionHash);
    // console.log({ recipt });
    if (!recipt)
      return res
        .status(400)
        .send({ success: false, data: "Invalid Transaction" });
    //  console.log("rerer", recipt.to.toLowerCase(), busdAddress, busdAddress === recipt.to.toLowerCase())
    if (
      !recipt.data.includes(jrAddress) &&
      !recipt.data.includes(ogAddress) &&
      !recipt.data.includes(busdAddress) &&
      recipt.to.toLowerCase() !==
        "0x" + process.env.BUSD_WALLET_ADDRESS.toLowerCase()
    )
      return res
        .status(400)
        .send({ success: false, data: "Invalid transactionss" });

    if (recipt.from !== address) {
      return res
        .status(400)
        .send({ success: false, data: "Invalid transactions" });
    }

    let getBlock = await db
      .get_scrooge_transactionDB()
      .findOne({ "transactionDetails.blockNumber": recipt?.blockNumber });
    if (getBlock?.transactionDetails?.blockNumber === recipt?.blockNumber) {
      return res.status(200).send({
        success: false,
        data: "Transaction is already exist",
      });
    }
    console.log("recipt", recipt);
    const amt = usd;
    console.log("amt", amt);
    // let cealAmount = Math.ceil(amt);
    console.log("cealAmount", usd);
    const data = await db.get_marketplace_gcPackagesDB().findOne({
      priceInBUSD: amt.toString(),
    });
    console.log("datadata--------", data);
    if (!data)
      return res
        .status(400)
        .send({ success: false, data: "Invalid transaction pid" });

    let query = {
      couponCode: promoCode,
      expireDate: { $gte: new Date() },
    };
    let findPromoData = await db.get_scrooge_promoDB().findOne(query);
    console.log("findPromoData", findPromoData);
    console.log(
      "findPromoData?.coupanType",
      findPromoData?.coupanType,
      findPromoData?.coupanType === "Percent"
        ? parseInt(data.freeTokenAmount) *
            (parseFloat(findPromoData?.discountInPercent) / 100)
        : findPromoData?.coupanType === "2X"
        ? parseInt(data.freeTokenAmount)
        : 0
    );
    console.log(
      "bonus amount ===>",
      findPromoData?.coupanType === "Percent"
        ? parseInt(data.freeTokenAmount) *
            (parseFloat(findPromoData?.discountInPercent) / 100)
        : 0
    );
    const trans = await addChips(
      userId,
      findPromoData?.coupanType === "Percent"
        ? parseInt(data.freeTokenAmount) +
            parseInt(data.freeTokenAmount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
        : findPromoData?.coupanType === "2X"
        ? parseInt(data.freeTokenAmount) * 2
        : parseInt(data.freeTokenAmount),
      address,
      "Crypto To Gold Coin",
      findPromoData?.coupanType === "Percent"
        ? parseInt(data.gcAmount) +
            parseInt(data.gcAmount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
        : findPromoData?.coupanType === "2X"
        ? parseInt(data.gcAmount) * 2
        : parseInt(data.gcAmount),
      recipt,
      findPromoData?.coupanType === "Percent"
        ? parseInt(data.freeTokenAmount) *
            (parseFloat(findPromoData?.discountInPercent) / 100)
        : findPromoData?.coupanType === "2X"
        ? parseInt(data.freeTokenAmount)
        : 0,
      amt
    );
    const reciptPayload = {
      username: username,
      email: email,
      walletAddress: address,
      invoicDate: 1,
      paymentMethod: "GC Purchase",
      packageName: "GoldCoin Purchase",
      tokenQuantity: parseInt(data.freeTokenAmount),
      goldCoinQuantity:
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.gcAmount) +
            parseInt(data.gcAmount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.gcAmount) * 2
          : parseInt(data.gcAmount),
      tokenQuantity:
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.freeTokenAmount) +
            parseInt(data.freeTokenAmount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.freeTokenAmount) * 2
          : parseInt(data.freeTokenAmount),
      purcahsePrice: amt.toString(),
      Tax: 0,
      firstName,
      lastName,
    };
    await sendInvoice(reciptPayload);
    if (refrenceId) {
      await db
        .get_scrooge_usersDB()
        .findOneAndUpdate(
          { _id: ObjectId(userId) },
          { $inc: { totalBuy: amt, totalProfit: amt } }
        );
    }
    console.log("before promoCode", promoCode);
    if (promoCode) {
      let payload = {
        userId: userId,
        claimedDate: new Date(),
      };
      console.log("promoCode", promoCode);
      console.log("payload", payload);
      let promoFind = await db
        .get_scrooge_promoDB()
        .findOne({ couponCode: promoCode.trim() });
      console.log("promoFind", promoFind);
      let updatePromo = await db.get_scrooge_promoDB().findOneAndUpdate(
        { couponCode: promoCode.trim() },
        {
          $push: { claimedUser: payload },
        },
        {
          new: true,
        }
      );
      console.log("updatePromoupdatePromoupdatePromo", updatePromo);
    }

    if (refrenceId) {
      let getUserdetails = await db
        .get_scrooge_usersDB()
        .findOne({ _id: userId });
      let affliateData = await db
        .get_affiliatesDB()
        .findOne({ userId: userId });
      let getAdminSettings = await db.get_db_admin_settingDB().findOne({});
      const { cryptoToGcReferalBonus } = getAdminSettings;
      // let getGcBonus=((cryptoToGcReferalBonus/100)*parseInt(data.gcAmount))
      let getTicketBonus = (cryptoToGcReferalBonus / 100) * parseInt(amt * 100);
      let affliateUserDetails = {
        commission: getTicketBonus,
        monthly_earned: getTicketBonus,
        referred_user_id: ObjectId(refrenceId),
        affiliate_id: affliateData?._id || null,
        userId: userId,
        transactionType: "Crypto to Gc",
        purchaseAmount: parseInt(amt),
        tokenAmount: getUserdetails?.wallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.get_db_affiliates_transactionDB().insertOne(affliateUserDetails);
      let getUser = await db.get_scrooge_usersDB().findOneAndUpdate(
        { _id: ObjectId(refrenceId) },
        {
          $inc: { wallet: getTicketBonus },
        },
        { new: true }
      );

      // db.get_affiliatesDB().findOneAndUpdate(
      //   { userId: ObjectId(refrenceId) },
      //   {
      //     $inc: {
      //       total_earned: getTicketBonus,
      //       monthly_earned: getTicketBonus,
      //     },
      //   },
      //   { new: true }
      // );

      let getUserData = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(refrenceId) });
      const {
        _id: referUserId,
        username: referUserName,
        email: referUserEmail,
        firstName: referUserFirstName,
        lastName: referUserLastName,
        profile: referUserProfile,
      } = getUserData;
      const transactionPayload = {
        amount: getTicketBonus,
        transactionType: "Crypto To Gc bonus",
        prevWallet: getUser?.value?.wallet,
        updatedWallet: getUser?.value?.wallet,
        // userId: ObjectId(refrenceId),

        userId: {
          _id: referUserId,
          username: referUserName,
          email: referUserEmail,
          firstName: referUserFirstName,
          referUserLastName,
          profile: referUserProfile,
          ipAddress: getUserData?.ipAddress,
        },

        updatedTicket: getUser?.value?.ticket + getTicketBonus,
        prevGoldCoin: getUser?.value?.goldCoin,
        updatedGoldCoin: getUser?.value?.goldCoin,
        createdAt: new Date(),
        updatedAt: new Date(),
        prevTicket: getUser?.value?.ticket,
      };
      const trans_id = await db
        .get_scrooge_transactionDB()
        .insertOne(transactionPayload);
    }

    console.log("OfferType", data?.offerType);
    if (data?.offerType === "MegaOffer") {
      await db
        .get_scrooge_usersDB()
        .findOneAndUpdate(
          { _id: ObjectId(userId) },
          { $push: { megaOffer: parseFloat(amt) } }
        );
    }
    let getUserDetail = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(userId) });
    res.status(200).send({
      success: true,
      data: "Chips Added Successfully",
      user: getUserDetail,
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
  try {
    let recipt = await useSDK.sdk_OG
      .getProvider()
      .getTransactionReceipt(transactionHash);
    if (recipt) {
      let getBlock = await db
        .get_scrooge_transactionDB()
        .findOne({ "transactionDetails.blockNumber": recipt?.blockNumber });
      if (getBlock?.transactionDetails?.blockNumber === recipt?.blockNumber) {
        return res.status(200).send({
          success: false,
          data: "Transaction is already exist",
        });
      }
      let getKycuser = await db
        .get_scrooge_user_kycs()
        .findOne({ userId: ObjectId(userId) });
      if (getKycuser?.status === "accept") {
        const response = await addChips(
          userId,
          parseInt(tokens),
          address,
          "Crypto To Token"
        ).then(async (trans) => {
          if (trans.code === 200) {
            const commission = (0.05 * tokens).toFixed(0);
            let findUserAff = await db
              .get_scrooge_usersDB()
              .findOne({ _id: ObjectId(userId) });
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
              const {
                _id,
                username,
                email,
                firstName,
                lastName,
                profile,
                ipAddress,
              } = getUserData;

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
                  ipAddress,
                },

                updatedTicket: commission,
                updatedGoldCoin: getUserData?.goldCoin,
                prevGoldCoin: getUserData?.goldCoin,
                createdAt: new Date(),
                updatedAt: new Date(),
                transactionDetails: recipt,
                prevTicket: getUserData?.ticket,
              };
              let trans_id;
              await db
                .get_scrooge_transactionDB()
                .insertOne(transactionPayload)
                .then((trans) => {
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
    } else {
      res
        .status(500)
        .send({ success: false, message: "Error in Request Process" });
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
    let userId = req?.user?._id;
    let ticket = parseInt(req.params.ticketPrice);
    if (ticket > 0) {
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

      await db.get_scrooge_usersDB().findOneAndUpdate(
        { _id: ObjectId(userId) },
        {
          $inc: {
            ticket: -parseInt(ticket),
            wallet: parseInt(ticket),
          },
        }
      );
      let getUserData = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(userId) });

      const { _id, username, email, firstName, lastName, profile, ipAddress } =
        getUserData;

      const transactionPayload = {
        amount: ticket,
        transactionType: "Ticket To Token",
        prevWallet: getUserData?.wallet - parseInt(ticket),
        updatedWallet: getUserData?.wallet,
        userId: {
          _id,
          username,
          email,
          firstName,
          lastName,
          profile,
          ipAddress,
        },
        updatedTicket: getUserData?.ticket,
        updatedGoldCoin: getUserData?.goldCoin,
        prevGoldCoin: getUserData?.goldCoin,
        prevTicket: getUserData?.ticket + parseInt(ticket),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db
        .get_scrooge_transactionDB()
        .insertOne(transactionPayload)
        .then((trans) => {})
        .catch((e) => {
          console.log("e", e);
        });
      resp = "Succesfully converted";

      return res.send({
        code: 200,
        success: true,
        message: resp,
        data: getUserData,
      });
    } else {
      res.send({ success: false, message: "Please enter valid ticket" });
    }
  } catch (error) {
    console.log(error);
    resp = false;
  }
  return resp;
}

const WithdrawQ = new Queue(async function (task, cb) {
  console.log("abcccc141441");
  if (task.type === "WithdrawRequest") {
    await WithdrawRequest(task.req, task.res);
  }
  if (task.type === "FastWithdrawRequest") {
    await FastWithdrawRequest(task.req, task.res);
  }
  cb(null, 1);
});

export const createWithdraw = async (req, res, next) => {
  console.log("createWithdraw route");
  try {
    WithdrawQ.push({ req, res, type: "WithdrawRequest" });
  } catch (error) {
    console.log("error", error);
  }
};
export const createFastWithdraw = async (req, res, next) => {
  console.log("createfastWithdraw route");
  try {
    WithdrawQ.push({ req, res, type: "FastWithdrawRequest" });
  } catch (error) {
    console.log("error", error);
  }
};
export async function WithdrawRequest(req, res) {
  console.log("call withdrwa");
  const address = req.params.address;
  const prize_id = req.params.prize_id;
  let updtdUser = await db
    .get_scrooge_usersDB()
    .findOne({ _id: req?.user?._id });
  console.log("updtdUser===>>>", updtdUser);
  let user_id = updtdUser?._id;
  // let token = updtdUser?.wallet;
  let totalwallet = updtdUser?.wallet;
  let nonWithdrawableAmt = updtdUser?.nonWithdrawableAmt;

  // console.log("token--->>>", token);

  try {
    if (req?.user?.isBlockWallet) {
      return res.send({
        success: false,
        message: "Your wallet blocked by admin",
      });
    }

    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(user_id) });
    if (getKycuser?.status !== "accept") {
      return res.send({ success: false, message: "Your kyc is not approved" });
    }
    const prize = await db
      .get_marketplace_prizesDB()
      .findOne({ _id: ObjectId(prize_id) });
    // console.log("prize", prize);

    if (totalwallet - nonWithdrawableAmt < prize?.price) {
      return res.send({ success: false, message: "Not Enough Tokens" });
    }
    await db.get_scrooge_usersDB().findOneAndUpdate(
      {
        _id: ObjectId(user_id),
        wallet: { $gte: parseInt(prize.price) }, // Ensure wallet is greater than or equal to the prize price
      },
      {
        $inc: { wallet: -parseInt(prize.price) },
      }
    );
    let getUserData = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(user_id) });

    const { _id, username, email, firstName, lastName, profile, ipAddress } =
      getUserData;

    const transactionPayload = {
      amount: -prize.price,
      transactionType: "Crypto Redeem",
      prevWallet: getUserData?.wallet,
      updatedWallet: getUserData?.wallet,
      userId: {
        _id,
        username,
        email,
        firstName,
        lastName,
        profile,
        ipAddress,
      },
      // updatedTicket: getUserData?.ticket,
      updatedGoldCoin: getUserData?.goldCoin,
      prevGoldCoin: getUserData?.goldCoin,
      // prevTicket: getUserData?.ticket + parseInt(prize.price),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let trans_id;
    const WithdrwaPayload = {
      status: "pending",
      address: address,
      redeemId: ObjectId(prize_id),
      userId: ObjectId(user_id),
    };
    await db.get_db_withdraw_requestDB().insertOne(WithdrwaPayload);
    await db
      .get_scrooge_transactionDB()
      .insertOne(transactionPayload)
      .then((trans) => {
        trans_id = trans.insertedId;
      })
      .catch((e) => {
        console.log("e", e);
      });
    emailSend.SubmitRedeemRequestEmail(email, username, prize.price);
    return res.send({
      success: true,
      prize,
      message:
        "Your redemption request has been received, please allow up to 24H for processing.",
    });
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}
export async function FastWithdrawRequest(req, res) {
  console.log("call fast withdrwa");
  const address = req.params.address;
  const amount = Number(req.params.amount);

  let updtdUser = await db
    .get_scrooge_usersDB()
    .findOne({ _id: req?.user?._id });
  console.log("updtdUser===>>>", updtdUser);
  let user_id = updtdUser?._id;
  // let token = updtdUser?.wallet;
  let totalwallet = updtdUser?.wallet;
  let nonWithdrawableAmt = updtdUser?.nonWithdrawableAmt;

  // console.log("token--->>>", token);

  try {
    if (req?.user?.isBlockWallet) {
      return res.send({
        success: false,
        message: "Your wallet blocked by admin",
      });
    }
    console.log("amount", amount);
    if (amount < 5000) {
      return res.send({
        success: false,
        message:
          "You can only request withdraw amount greater or equal to  5000",
      });
    }
    const resp = await fetch(`https://api.coinbrain.com/public/coin-info`, {
      method: "post",
      body: JSON.stringify({
        56: [process.env.OG_CONTRACT_ADDRESS],
      }),
    });
    const data = await resp.json();
    const current_price = data[0].priceUsd;
    console.log("current_price", current_price);
    // const totalScrooge = (amount * 100) / current_price;
    let totalScrooge = (Number(amount) / 100 / current_price).toFixed(0);
    totalScrooge = totalScrooge - totalScrooge * 0.01;

    console.log("totalScroogetotalScrooge", totalScrooge);

    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(user_id) });
    if (getKycuser?.status !== "accept") {
      return res.send({ success: false, message: "Your kyc is not approved" });
    }
    // const prize = await db
    //   .get_marketplace_prizesDB()
    //   .findOne({ _id: ObjectId(prize_id) });
    // // console.log("prize", prize);

    if (totalwallet - nonWithdrawableAmt < amount) {
      return res.send({ success: false, message: "Not Enough Tokens" });
    }
    await db.get_scrooge_usersDB().findOneAndUpdate(
      {
        _id: ObjectId(user_id),
        wallet: { $gte: parseInt(amount) }, // Ensure wallet is greater than or equal to the prize price
      },
      {
        $inc: { wallet: -parseInt(amount) },
      }
    );
    let getUserData = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(user_id) });

    const { _id, username, email, firstName, lastName, profile, ipAddress } =
      getUserData;

    const transactionPayload = {
      amount: -parseInt(amount),
      transactionType: "Crypto Redeem",
      prevWallet: getUserData?.wallet,
      updatedWallet: getUserData?.wallet,
      userId: {
        _id,
        username,
        email,
        firstName,
        lastName,
        profile,
        ipAddress,
      },
      // updatedTicket: getUserData?.ticket,
      updatedGoldCoin: getUserData?.goldCoin,
      prevGoldCoin: getUserData?.goldCoin,
      // prevTicket: getUserData?.ticket + parseInt(prize.price),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let trans_id;
    const WithdrwaPayload = {
      status: "pending",
      address: address,
      redeemPrize: totalScrooge,
      withdrawToken: parseInt(amount),
      userId: ObjectId(user_id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.get_db_withdraw_requestDB().insertOne(WithdrwaPayload);
    await db
      .get_scrooge_transactionDB()
      .insertOne(transactionPayload)
      .then((trans) => {
        trans_id = trans.insertedId;
      })
      .catch((e) => {
        console.log("e", e);
      });
    emailSend.SubmitRedeemRequestEmail(email, username, parseInt(amount));
    return res.send({
      success: true,
      prize: totalScrooge,
      message:
        "Your redemption request has been received, please allow up to 24H for processing.",
    });
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}
const promoQue = new Queue(async function (task, cb) {
  if (task.type === "applyPromo") {
    await applyPromo(task.req, task.res);
  }
  cb(null, 1);
});

export const applyPromoCode = async (req, res, next) => {
  try {
    promoQue.push({ req, res, type: "applyPromo" });
  } catch (error) {
    console.log("error", error);
  }
};

export async function applyPromo(req, res) {
  let user = req.user._id;
  try {
    const { promocode } = req.body;
    let query = {
      couponCode: promocode,
      expireDate: { $gte: new Date() },
    };
    let getPromo = await db.get_scrooge_promoDB().findOne(query);
    const { coupanInUse, claimedUser } = getPromo || {};
    console.log("coupanInUse", coupanInUse);
    console.log("getPromo", getPromo);
    console.log("claimedUser", claimedUser);
    if (coupanInUse === "One Time") {
      let findUser = claimedUser.find(
        (el) => el.userId.toString() === user.toString()
      );
      console.log("findUser", findUser);
      if (findUser) {
        return res.status(404).send({
          code: 404,
          success: false,
          message: "Promo code already in use.",
        });
      }
    }
    if (!getPromo) {
      return res
        .status(404)
        .send({ code: 404, success: false, message: "Invalid promo code." });
    }
    return res.send({
      code: 200,
      success: true,
      getPromo,
      message: "Promo code applied.",
    });
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function getCryptoToGCPurcahse(req, res) {
  let user = req.user._id;
  const popularData = await db
    .get_scrooge_transactionDB()
    .aggregate([
      {
        $match: {
          "userId._id": user,
          transactionType: { $in: ["Crypto To Gold Coin", "CC To Gold Coin"] },
        },
      },
      {
        $group: {
          _id: "$transactionType",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
  return res.send(popularData);
}

export async function WithdrawRequestWithFiat(req, res) {
  console.log("req,body", req.body);
  const {
    amount: redeemPrize,
    paymentType,
    cashAppid,
    email: fiatEmail,
  } = req.body || {};
  let updtdUser = await db
    .get_scrooge_usersDB()
    .findOne({ _id: req?.user?._id });
  console.log("updtdUser===>>>", updtdUser);
  let user_id = updtdUser?._id;
  let token = updtdUser?.wallet;
  console.log("token--->>>", token);

  const redeemToken = redeemPrize;

  try {
    if (req?.user?.isBlockWallet) {
      return res.send({
        success: false,
        message: "Your wallet blocked by admin",
      });
    }

    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(user_id) });
    if (getKycuser?.status !== "accept") {
      return res.send({ success: false, message: "Your kyc is not approved" });
    }
    console.log("redeemToken", redeemToken);

    if (token < redeemToken) {
      return res.send({ success: false, message: "Not Enough Tokens" });
    }

    await db.get_scrooge_usersDB().findOneAndUpdate(
      {
        _id: ObjectId(user_id),
        wallet: { $gte: redeemToken }, // Ensure wallet is greater than or equal to the prize price
      },
      {
        $inc: { wallet: -redeemToken },
      }
    );
    let getUserData = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(user_id) });

    const { _id, username, email, firstName, lastName, profile, ipAddress } =
      getUserData;

    const transactionPayload = {
      amount: -redeemToken,
      transactionType: "Fiat Redeem",
      prevWallet: getUserData?.wallet,
      updatedWallet: getUserData?.wallet,
      userId: {
        _id,
        username,
        email,
        firstName,
        lastName,
        profile,
        ipAddress,
      },
      updatedGoldCoin: getUserData?.goldCoin,
      prevGoldCoin: getUserData?.goldCoin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let trans_id;
    const WithdrwaPayload = {
      status: "pending",
      redeemPrize,
      paymentType,
      cashAppid,
      email: fiatEmail,
      userId: ObjectId(user_id),
    };
    await db.get_db_withdraw_requestDB().insertOne(WithdrwaPayload);
    await db
      .get_scrooge_transactionDB()
      .insertOne(transactionPayload)
      .then((trans) => {
        trans_id = trans.insertedId;
      })
      .catch((e) => {
        console.log("e", e);
      });
    emailSend.SubmitRedeemRequestEmail(email, username, redeemPrize);

    return res.send({
      success: true,
      message:
        "Your redemption request has been received, please allow up to 24H for processing.",
    });
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function getFormToken(req, res) {
  // let user = req.user._id;
  const { user } = req || {};
  console.log("useruseruseruser", req.body);
  try {
    getAnAcceptPaymentPage(req.body, user, async (response) => {
      console.log("response", response);
      return res.send({
        code: 200,
        success: true,
        response,
      });
    });
  } catch (error) {
    console.error("errrtt", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function FastWithdrawRedeem(req, res) {
  let resp;
  const withdraw_id = req.params.withdraw_id;
  const transactionHash = req.params.transactionHash;
  let user_ticket;
  try {
    let recipt = await useSDK.sdk.getProvider().getTransaction(transactionHash);
    console.log("getOGCurrentPrice", recipt);
    const query = await db
      .get_db_withdraw_requestDB()
      .findOne({ _id: ObjectId(withdraw_id) });

    const user_id = query?.userId;
    const withdrawToken = query?.withdrawToken;
    let getKycuser = await db
      .get_scrooge_user_kycs()
      .findOne({ userId: ObjectId(user_id) });
    if (getKycuser?.status === "accept") {
      const user = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(user_id) });

      user_ticket = user?.ticket;
      try {
        await db.get_db_withdraw_requestDB().findOneAndUpdate(
          { _id: ObjectId(withdraw_id) },
          {
            $set: {
              status: "Approved",
              transactionHash: transactionHash,
            },
          }
        );

        let getUserData = await db
          .get_scrooge_usersDB()
          .findOne({ _id: ObjectId(user_id) });
        const {
          _id,
          username,
          email,
          firstName,
          lastName,
          profile,
          ipAddress,
        } = getUserData;
        const transactionPayload = {
          amount: withdrawToken,
          transactionType: "Approve Crypto Redeem",
          prevWallet: getUserData?.wallet + parseInt(withdrawToken),
          updatedWallet: getUserData?.wallet,
          userId: {
            _id,
            username,
            email,
            firstName,
            lastName,
            profile,
            ipAddress,
          },
          updatedGoldCoin: getUserData?.goldCoin,
          prevGoldCoin: getUserData?.goldCoin,
          transactionDetails: {
            transactionHash: transactionHash,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db
          .get_scrooge_transactionDB()
          .insertOne(transactionPayload)
          .catch((e) => {
            console.log("e", e);
          });
        // emailSend.ApproveRedeemRequestEmail(email, username, hash, from);
        return res.send({ success: true, message: resp });
      } catch (error) {
        console.log("error---", error);
        resp = error?.reason || "Transaction Failed";
        return res.send({ success: false, message: resp });
      }
    } else {
      resp = "Invalid Prize Data";
      return res.send({ success: false, message: resp });
    }
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function getWeeklyWheel(req, res) {
  try {
    const { _id: userId } = req.user;
    let query = {
      "userId._id": ObjectId(userId),
      transactionType: {
        $in: ["Crypto To Gold Coin", "CC To Gold Coin", "Paypal To Gold Coin"],
      },
    };

    const getWeeklyPurchase = await db
      .get_scrooge_transactionDB()
      .findOne(query, { sort: { _id: -1 } });
    if (getWeeklyPurchase) {
      const prevDt = new Date();
      prevDt.setDate(prevDt.getDate() - 6);
      prevDt.setHours(0, 0, 0, 0);
      if (prevDt.getTime() <= new Date(getWeeklyPurchase.createdAt).getTime()) {
        return res.send({ success: true, isWeeklySpin: true });
      } else {
        return res.send({ success: false, isWeeklySpin: false });
      }
    }

    return res.send({ success: true, userId });
  } catch (error) {
    console.log("error in getWeeklyWheel", error);
  }
}
const promoSTQue = new Queue(async function (task, cb) {
  if (task.type === "redeemFreePromo") {
    await redeemFreePromo(task.req, task.res);
  }
  cb(null, 1);
});

export const redeemFreePromoST = async (req, res, next) => {
  try {
    promoSTQue.push({ req, res, type: "redeemFreePromo" });
  } catch (error) {
    console.log("error", error);
  }
};

export async function redeemFreePromo(req, res) {
  let user = req.user._id;
  try {
    const { promocode } = req.body;
    let query = {
      couponCode: promocode,
      expireDate: { $gte: new Date() },
    };
    let getPromo = await db.get_scrooge_promoDB().findOne(query);
    const { coupanInUse, claimedUser, token } = getPromo || {};
    if (coupanInUse === "One Time") {
      let findUser = claimedUser.find(
        (el) => el.userId.toString() === user.toString()
      );
      if (findUser) {
        return res.status(404).send({
          code: 404,
          success: false,
          message: "Promo code already in use.",
        });
      } else {
        let payload = {
          userId: user,
          claimedDate: new Date(),
        };
        let promoFind = await db
          .get_scrooge_promoDB()
          .findOne({ couponCode: promocode.trim() });
        await db.get_scrooge_promoDB().findOneAndUpdate(
          { couponCode: promocode.trim() },
          {
            $push: { claimedUser: payload },
          },
          {
            new: true,
          }
        );
        let updateUser = await db.get_scrooge_usersDB().findOneAndUpdate(
          { _id: ObjectId(user) },
          {
            $inc: {
              wallet: token,
              monthlyClaimBonus: token,
              nonWithdrawableAmt: token,
            },
          },
          { new: true } // Specify the option outside the update object
        );
        const exprDate = new Date();
        exprDate.setHours(24 * 30 + exprDate.getHours());
        exprDate.setSeconds(0);
        exprDate.setMilliseconds(0);
        await db.get_scrooge_bonus().insert({
          userId: ObjectId(user),
          bonusType: "monthly",
          bonusAmount: token,
          bonusExpirationTime: exprDate,
          wagerLimit: token,
          rollOverTimes: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpired: false,
          wageredAmount: 0,
          subCategory: "Promo Bonus",
          restAmount: token,
          expiredAmount: token,
          executing: false,
        });
        const {
          _id,
          username,
          email,
          firstName,
          lastName,
          profile,
          ipAddress,
        } = updateUser?.value;
        const transactionPayload = {
          amount: token,
          transactionType: "Free Promo ST",
          prevWallet: parseFloat(updateUser?.value?.wallet),
          updatedWallet: updateUser?.value?.wallet + parseFloat(token),
          userId: {
            _id,
            username,
            email,
            firstName,
            lastName,
            profile,
            ipAddress,
          },
          updatedGoldCoin: updateUser?.value?.goldCoin,
          prevGoldCoin: updateUser?.value?.goldCoin,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db
          .get_scrooge_transactionDB()
          .insertOne(transactionPayload)
          .catch((e) => {
            console.log("e", e);
          });
      }
      return res.send({
        code: 200,
        success: true,
        getPromo,
        message: "Token added successfully.",
      });
    }
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

const getGCPurchaseAffliateBonus = async (
  extractedId,
  extractedReffrenceId,
  amount
) => {
  console.log("888888888888888", extractedId, extractedReffrenceId, amount);
  try {
    let getUserdetails = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedId) });
    console.log("getUsergetUser", getUserdetails);
    let affliateData = await db
      .get_affiliatesDB()
      .findOne({ userId: extractedId });
    let getAdminSettings = await db.get_db_admin_settingDB().findOne({});
    const { cryptoToGcReferalBonus } = getAdminSettings;
    let getTicketBonus =
      (cryptoToGcReferalBonus / 100) * parseInt(amount * 100);
    console.log(
      "getTicketBonus",
      getTicketBonus,
      amount,
      cryptoToGcReferalBonus
    );
    let affliateUserDetails = {
      commission: getTicketBonus,
      monthly_earned: getTicketBonus,
      referred_user_id: ObjectId(extractedReffrenceId),
      affiliate_id: affliateData?._id || null,
      userId: ObjectId(extractedId),
      transactionType: "CC to Gc",
      purchaseAmount: amount,
      tokenAmount: getUserdetails?.wallet,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.get_db_affiliates_transactionDB().insertOne(affliateUserDetails);
    // let getUser = await db.get_scrooge_usersDB().findOneAndUpdate(
    //   { _id: ObjectId(extractedReffrenceId) },
    //   {
    //     $inc: { wallet: getTicketBonus },
    //   },
    //   { new: true }
    // );

    db.get_affiliatesDB().findOneAndUpdate(
      { userId: ObjectId(extractedReffrenceId) },
      {
        $inc: {
          // total_earned: getTicketBonus,
          // monthly_earned: getTicketBonus,
        },
      },
      { new: true }
    );

    await db.get_scrooge_usersDB().findOneAndUpdate(
      { _id: ObjectId(extractedId) },
      {
        $inc: {
          totalBuy: parseInt(amount),
          totalProfit: parseInt(amount),
        },
      }
    );
    let getUser = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedReffrenceId) });
    let getUserData = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedReffrenceId) });

    console.log("-----------------", getUserData);
    const {
      _id: referUserId,
      username: referUserName,
      email: referUserEmail,
      firstName: referUserFirstName,
      lastName: referUserLastName,
      profile: referUserProfile,
    } = getUserData;
    const transactionPayload = {
      amount: getTicketBonus,
      transactionType: "CC To Gc bonus",
      prevWallet: getUser?.value?.wallet,
      updatedWallet: getUser?.value?.wallet,
      // userId: ObjectId(refrenceId),

      userId: {
        _id: referUserId,
        username: referUserName,
        email: referUserEmail,
        firstName: referUserFirstName,
        referUserLastName,
        profile: referUserProfile,
        ipAddress: getUserData?.ipAddress,
      },

      updatedTicket: getUser?.value?.ticket + getTicketBonus,
      prevGoldCoin: getUser?.value?.goldCoin,
      updatedGoldCoin: getUser?.value?.goldCoin,
      createdAt: new Date(),
      updatedAt: new Date(),
      prevTicket: getUser?.value?.ticket,
    };
    await db.get_scrooge_transactionDB().insertOne(transactionPayload);
  } catch (error) {
    console.log("error", error);
  }
};

export async function paypalOrder(req, res) {
  let user = req.user;
  try {
    console.log("paypalOrder user", user, req.body);
    const { orderID, promoCode } = req.body;
    console.log("orderID", orderID, promoCode);

    let token = `Bearer ${await getToken()}`;
    console.log("token", token);
    const captureResponse = await axios.post(
      `${process.env.PAYPAL_URL}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: token,
        },
      }
    );

    // Example response from PayPal capture API
    const { status, id } = captureResponse.data;
    if (status === "COMPLETED" && id) {
      console.log("Capture response:", { status, id });
      const { value } =
        captureResponse?.data?.purchase_units[0]?.payments?.captures[0].amount;
      let amount = parseFloat(value)?.toString();
      if (amount) {
        const data = await db.get_marketplace_gcPackagesDB().findOne({
          priceInBUSD: amount?.toString(),
        });
        if (data) {
          let query = {
            couponCode: promoCode,
            expireDate: { $gte: new Date() },
          };
          let findPromoData = await db.get_scrooge_promoDB().findOne(query);
          const trans = await addChips(
            user?._id?.toString(),
            findPromoData?.coupanType === "Percent"
              ? parseInt(data.freeTokenAmount) +
                  parseInt(data.freeTokenAmount) *
                    (parseFloat(findPromoData?.discountInPercent) / 100)
              : findPromoData?.coupanType === "2X"
              ? parseInt(data.freeTokenAmount) * 2
              : parseInt(data.freeTokenAmount),
            "",
            "Paypal To Gold Coin",
            findPromoData?.coupanType === "Percent"
              ? parseInt(data?.gcAmount) +
                  parseInt(data?.gcAmount) *
                    (parseFloat(findPromoData?.discountInPercent) / 100)
              : findPromoData?.coupanType === "2X"
              ? parseInt(data.gcAmount) * 2
              : parseInt(data.gcAmount),
            captureResponse?.data,
            findPromoData?.coupanType === "Percent"
              ? parseInt(data.freeTokenAmount) *
                  (parseFloat(findPromoData?.discountInPercent) / 100)
              : findPromoData?.coupanType === "2X"
              ? parseInt(data.freeTokenAmount)
              : 0,
            amount //amount?.toString() === "9.99"
            // ? 1500
            // : 0
          );
          const reciptPayload = {
            username: user?.username,
            email: user?.email,
            invoicDate: moment(new Date()).format("D MMMM  YYYY"),
            paymentMethod: "Credit Card Purchase",
            packageName: "Gold Coin Purchase",
            goldCoinQuantity: parseInt(data?.gcAmount),
            tokenQuantity: parseInt(data?.freeTokenAmount),
            purcahsePrice: amount?.toString(),
            Tax: 0,
            firstName: user?.firstName,
            lastName: user?.lastName,
          };
          if (data?.offerType === "MegaOffer") {
            await db.get_scrooge_usersDB().findOneAndUpdate(
              { _id: ObjectId(user?._id) },

              { $push: { megaOffer: parseFloat(amount) } }
            );
          }

          const result = await db
            .get_scrooge_usersDB()
            .findOneAndUpdate(
              { _id: ObjectId(user?._id) },
              { $set: { isSpended: true } }
            );
          await emailSend.InvoiceEmail(user?.email, reciptPayload);
          if (promoCode) {
            let payload = {
              userId: user?._id,
              claimedDate: new Date(),
            };

            let promoFind = await db
              .get_scrooge_promoDB()
              .findOne({ couponCode: promoCode.trim() });
            await db.get_scrooge_promoDB().findOneAndUpdate(
              { couponCode: promoCode.trim() },
              {
                $push: { claimedUser: payload },
              },
              {
                new: true,
              }
            );
          }

          if (user?.refrenceId) {
            getGCPurchaseAffliateBonus(user?._id, user?.refrenceId, amount);
          }
        }
      }
      // Respond to the client with success
      res.status(200).json({ message: "Chips added successfully." });
    }
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export async function IdAnalyzerWithDocupass(req, res) {
  let user = req.user;
  try {
    // Request data
    const requestData = {
      version: "v3",
      customData: user._id,
      profile: "409fc24fd8094eb8957a9faf3d82c414",
      mode: "ID verification + Face verification against uploaded ID",
    };

    // Axios POST request
    axios
      .post("https://api2.idanalyzer.com/docupass", requestData, {
        headers: {
          "X-API-KEY": "6fT1C2fOcaqkk5Uim7dWybraFqUdCQ3V",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("Response:", response.data);
        res.status(200).send({
          response: response?.data,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    console.log("IdAnalyzerWithDocupass user");

    // Respond to the client with success
  } catch (e) {
    console.log("outerCatch", e);
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}
