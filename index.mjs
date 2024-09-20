import express, { json } from "express";
import * as db from "./config/mongodb.mjs";
import passport from "passport";
import auth from "./middlewares/auth.mjs";
import jwtStrategy from "./config/passport.mjs";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import helmet from "helmet";
import * as rewards from "./config/rewards.mjs";
import * as affiliate from "./config/affiliate.mjs";
import * as useSDK from "./config/sdk.mjs";
import ip from "request-ip";

import * as raffles from "./raffles/raffles.mjs";
import * as rouletteSpin from "./rouletteSpin/rouletteSpin.mjs";
import * as sharable from "./config/sharable_data.mjs";
// import * as email from "./email/email.mjs";
import * as chatgpt from "./config/chatgpt.mjs";
import * as common from "./config/commons.mjs";
import * as utilities from "./config/utilities.mjs";
import {
  processStripeCheckOut,
  processStripeWebhook,
} from "./config/stripe.mjs";
import cors from "cors";
import { checkUserCanSpin } from "./rouletteSpin/rouletteUtils.mjs";
import { CryptoToGCQueue, TicketToTokenQueue } from "./utils/Queues.mjs";
import logger from "./config/logger.mjs";
import {
  createAnAcceptPaymentTransaction,
  createAuthCustomAnAcceptPaymentTransaction,
  createFreeSpin,
  getAnAcceptPaymentPage,
  getTransactionDetails,
} from "./utils/payment.mjs";
import { sendInvoice } from "./utils/sendx_send_invoice.mjs";
import { ObjectId } from "mongodb";
import Queue from "better-queue";
import { authLimiter, rateAuthLimit } from "./middlewares/rateLimiter.mjs";
import { InvoiceEmail } from "./email/emailSend.mjs";
import moment from "moment";
import { Server } from "socket.io";

import Basicauth from "./middlewares/basicAuth.mjs";
import { decryptData } from "./middlewares/decrypt.mjs";

const app = express();

const server = createServer(app);

const io = new Server(server, {});

const PORT = process.env.PORT;
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3004",
      "http://localhost:4242",
      "https://scrooge.casino",
      "https://poker.scrooge.casino",
      "https://blackjack.scrooge.casino",
      "https://slot.scrooge.casino",
      "https://admin.scrooge.casino",
      "https://market.scrooge.casino",
      "https://roulette.scrooge.casino",

      "https://dev.scrooge.casino",
      "https://devpoker.scrooge.casino",
      "https://devslot.scrooge.casino",
      "https://devblackjack.scrooge.casino",
      "https://devadmin.scrooge.casino",
      "https://devmarket.scrooge.casino",
      "https://devroulette.scrooge.casino",
      "https://market-newui.scrooge.casino",

      "https://beta.scrooge.casino",
      "https://betapoker.scrooge.casino",
      "https://betaslot.scrooge.casino",
      "https://betablackjack.scrooge.casino",
      "https://betaadmin.scrooge.casino",
      "https://betamarket.scrooge.casino",
      "https://betaroulette.scrooge.casino",

      "https://landing-newui.scrooge.casino",
      "https://market-newui.scrooge.casino",
    ],
    credentials: true,
  })
);
app.use(json());
app.use(cookieParser());
// app.use("/api/accept-deceptor", authLimiter);

passport.use("jwt", jwtStrategy);

// app.use((req, _, next) => {
//   logger.info(`HEADERS ${req.headers} `);
//   next();
// });
app.use(async (req, res, next) => {
  if (
    !db.get_scrooge_usersDB() ||
    !db.get_sharing_messagesDB() ||
    !db.get_marketplace_redeem_prize_transactionsDB() ||
    !db.get_marketplace_prizesDB() ||
    !db.get_marketplace_itemsDB() ||
    !db.get_marketplace_holder_claim_chips_transactionsDB() ||
    !db.get_marketplace_ducky_lucks_prizesDB() ||
    !db.get_marketplace_ducky_lucks_chip_claimsDB() ||
    !db.get_marketplace_daily_reward_token_claimsDB() ||
    !db.get_marketplace_coupons_merchDB() ||
    !db.get_marketplace_chip_transactionsDB() ||
    !db.get_affiliates_successful_actionsDB() ||
    !db.get_affiliatesDB() ||
    !db.get_rafflesDB() ||
    !db.get_raffles_drawsDB() ||
    !db.get_raffles_entriesDB() ||
    !db.get_raffles_usersDB() ||
    !db.get_raffles_usersDB() ||
    !db.get_scrooge_ticket_to_token
  ) {
    await db.connectToDB();
  }
  /*
    if (!db.get_marketplace_wallet_addressesDB()) {
        await db.connectToDB();
    }
    if (!db.get_common_batch_burn_transactionsDB()) {
        await db.connectToDB();
    }
    if (!db.get_common_burn_requestsDB()) {
        await db.connectToDB();
    }
    if (!db.get_common_common_totalsDB()) {
        await db.connectToDB();
    }
    if (!db.get_sharing_hashtagsDB()) {
        await db.connectToDB();
    }*/
  /*if (!db.get_sharing_responsesDB()) {
        await db.connectToDB();
    }
    if (!db.get_sharing_twitterInfluencersDB()) {
        await db.connectToDB();
    }
    if (!db.get_user_details_casino_profile_pointsDB()) {
        await db.connectToDB();
    }*/
  next();
});

//################################# Affiliates #################################//
// Route to get Affiliate user
app.get(
  "/api/getAffiliateUser/:user_id",
  Basicauth,
  auth(),
  affiliate.getAffiliateUser
);

// Route to create Affiliate user
app.get(
  "/api/createAffiliateUser/:user_id/:ip_address",
  Basicauth,
  auth(),
  affiliate.createAffiliateUser
);

// Route to get affiliate leaders by number of tokens earned
app.get(
  "/api/getAffLeadersByTokens/:limit/:days",
  Basicauth,
  auth(),
  affiliate.getAffLeadersByTokens
);

// Route to get affiliate leaders by number of commissions (num of sales) earned
app.get(
  "/api/getAffLeadersByCount/:limit/:days",
  Basicauth,
  auth(),
  affiliate.getAffLeadersByCount
);

// Route to get affiliate leaders by number of commissions (num of sales) earned
app.get(
  "/api/getAffLeadersByType/:type/:limit/:days",
  Basicauth,
  auth(),
  affiliate.getAffLeadersByType
);

//################################# Common Data #################################//

//################################# Email #################################//
// Route to trigger email
// app.get("/api/sendEmail/:to/:subject/:body", auth(), async (req, res) => {
//   const resp = await email.sendemail(req).then((data) => {
//     res.send(data);
//   });
// });

//################################# Items #################################//
// app.get(
//   "/api/getFreeTokens/:address/:token_id/:user_id/:qty/:aff_id",
//  auth(), async (req, res) => {
//     const resp = await useSDK.getFreeTokens(req).then((data) => {
//       res.send(data);
//     });
//   }
// );

// app.post("/api/getFreeTokens", auth(), async (req, res) => {
//   useSDK.getFreeTokens(req, res);
// const resp = await useSDK.getFreeTokens(req).then((data) => {
//   res.send(data);
// });
// });

app.get("/api/getItems/:type", Basicauth, auth(), async (req, res) => {
  const resp = await rewards.getItems(req).then((data) => {
    res.send(data);
  });
});

//################################# Prizes #################################//
// Route to get available prizes
app.get("/api/getPrizes", Basicauth, auth(), async (req, res) => {
  const resp = await rewards.getPrizes(req).then((data) => {
    // console.log("prizes resp: ", data);
    res.send(data);
  });
});

app.get("/api/getGCPackages", Basicauth, auth(), rewards.getCryptoToGCPackages);
app.get("/api/getTicketToToken", Basicauth, auth(), rewards.getTicketToToken);

// Route to get user's redeemed prizes
app.get(
  "/api/getUserRedeemed/:user_id",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await rewards.getUserRedeemed(req).then((data) => {
      res.send(data);
    });
  }
);

// Route to update markRedeemed flag in prize_redeem_transactions table
app.get(
  "/api/markMerchCouponRedeemed/:trans_id/:user_id",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await rewards.markMerchCouponRedeemed(req).then((data) => {
      res.send(data);
    });
  }
);

// Route to redeem prize
app.get("/api/redeemPrize/:withdraw_id/:transactionHash", rewards.redeemPrize);

//################################# Raffles #################################//
// Route to get current raffles

// Route to get last claim date
app.get(
  "/api/getNextClaimDate/:address/:type/:user_id/:token_id",
  auth(),
  rewards.getNextClaimDate
);

// Route to claim DL Tokens
app.get(
  "/api/claimDLTokens/:address/:user_id/:token_id",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await rewards.claimDLTokens(req).then((data) => {
      res.send(data);
    });
  }
);

// Route to claim daily rewards
app.get(
  "/api/claimDailyRewards/:user_id",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await rewards.claimDailyRewards(req).then((data) => {
      res.send(data);
    });
  }
);

app.get("/api/getDLNFTs/:address", Basicauth, auth(), useSDK.getDLNFTs);

// Route to claim holder monthly Tokens
app.get(
  "/api/claimHolderTokens/:address/:signerToken",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await rewards.claimHolderTokens(req).then((data) => {
      res.send(data);
    });
  }
);

//################################# Sharable Data #################################//
// Route to get Sharable Messages
app.get(
  "/api/getSharableMessages",
  Basicauth,
  auth(),
  sharable.getSharableMessages
);

// Route to get shortened link
app.get("/api/getShortLink/:link", Basicauth, auth(), sharable.getShortLink);

//Reute to get user reward
app.get(
  "/api/shareReward/:user_id/:message_id",
  Basicauth,
  auth(),
  sharable.shareReward
);
app.get(
  "/api/getSocialShare/:user_id",
  Basicauth,
  auth(),
  sharable.getSocialShare
);

// Route to get AI message
app.get(
  "/api/getAIMessage/:prompt/:user_id/:type",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await chatgpt.getAIMessage(req).then((data) => {
      res.send(data);
    });
  }
);

//################################# Stripe #################################//
app.get(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  auth(),
  (request, response) => {
    const res = processStripeWebhook(request, response);
    // response.send();
  }
);
app.post("/api/user/depositMoney", auth(), (request, response) => {
  // console.log("request",request?.body
  // );
  processStripeCheckOut(request, response);
});

//################################# User #################################//

//################################# Utilities #################################//
app.get("/api/decrypt/:text", auth(), (req, res) => {
  const resp = utilities.decrypt(req);
  res.send(resp);
});

app.get("/api/encrypt/:text", auth(), (req, res) => {
  const resp = utilities.encrypt(req);
  res.send(resp);
});

//################################# Wallet #################################//
// Route to get OG Balance
app.get("/api/getOGBalance/:address", Basicauth, auth(), useSDK.getOGBalance);

// Route to get user's NFT balance
app.get(
  "/api/getWalletNFTBalanceByTokenID/:address/:token_id/:user_id/:qty",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await useSDK.getWalletNFTBalanceByTokenID(req).then((data) => {
      res.send(data);
    });
  }
);

// Route to get wallet DL data
app.get(
  "/api/getWalletDLBalance/:address",
  Basicauth,
  auth(),
  async (req, res) => {
    const resp = await useSDK.getWalletDLBalance(req).then((data) => {
      res.send(data);
    });
  }
);

app.get(
  "/api/convertCryptoToToken/:userId/:address/:tokens/:transactionHash",
  Basicauth,
  auth(),
  rewards.convertCryptoToToken
);
app.get(
  "/api/convertCryptoToGoldCoin/:address/:transactionHash",
  Basicauth,
  auth(),
  (req, res) => {
    CryptoToGCQueue.push({ req, res }, (err, result) => {
      console.log("gc purchased converted.", err, result);
    });
  }
);

app.get(
  "/api/coverttickettotoken/:ticketPrice",
  Basicauth,
  auth(),
  async (req, res) => {
    TicketToTokenQueue.push({ req, res }, (err, result) => {
      console.log("ticket converted.", err, result);
    });
  }
);

app.post("/api/bitcartcc-notification", async (req, res) => {
  console.log("payed on bitcart", {
    query: req.query,
    params: req.params,
    body: req.body,
  });
  res.send({ success: true });
});

const getGCPurchaseAffliateBonus = async (
  extractedId,
  extractedReffrenceId,
  amount
) => {
  // console.log("888888888888888", extractedId, extractedReffrenceId, amount);
  try {
    let getUserdetails = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedId) });
    // console.log("getUsergetUser", getUserdetails);
    let affliateData = await db
      .get_affiliatesDB()
      .findOne({ userId: extractedId });
    let getAdminSettings = await db.get_db_admin_settingDB().findOne({});
    const { cryptoToGcReferalBonus } = getAdminSettings;
    let getTicketBonus =
      (cryptoToGcReferalBonus / 100) * parseInt(amount * 100);
    // console.log(
    //   "getTicketBonus",
    //   getTicketBonus,
    //   amount,
    //   cryptoToGcReferalBonus
    // );
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
          totalBuy: parseFloat(amount),
          totalProfit: parseFloat(amount),
        },
      }
    );
    let getUser = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedReffrenceId) });
    let getUserData = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedReffrenceId) });

    // console.log("-----------------", getUserData);
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

app.get(
  "/api/WithdrawRequest/:address/:prize_id",
  Basicauth,
  auth(),
  rewards.createWithdraw
);
app.get(
  "/api/FastWithdrawRequest/:address/:amount",
  Basicauth,
  auth(),
  rewards.createFastWithdraw
);

app.post("/api/accept-deceptor", auth(), authLimiter, async (req, res) => {
  // console.log("hello console");
  try {
    const { user, body } = req || {};
    if (user?.isBlockWallet) {
      return res
        .status(400)
        .send({ success: false, data: "Your wallet blocked by admin" });
    }
    const binStr = new RegExp(`^${body.bin}`, "gm");
    const bin = await db.get_scrooge_bin().findOne({
      binNumber: binStr,
    });

    if (bin?.isbinBlock) {
      return res
        .status(500)
        .send({ success: false, message: "BIN is not supported" });
    }

    const data = await db.get_marketplace_gcPackagesDB().findOne({
      priceInBUSD: body.item.actualAmount,
    });
    if (!data)
      return res
        .status(400)
        .send({ success: false, data: "Invalid price amount" });
    createAnAcceptPaymentTransaction(body, user, async (response) => {
      if (
        response.messages.resultCode !== "Ok" ||
        response.transactionResponse?.errors
      ) {
        return res.status(400).send({
          success: false,
          data: "transaction failed",
          error: response.transactionResponse?.errors?.error[0]?.errorText,
        });
      }

      let query = {
        couponCode: body.item.promoCode,
        expireDate: { $gte: new Date() },
      };

      let findPromoData = await db.get_scrooge_promoDB().findOne(query);
      const trans = await rewards.addChips(
        user._id.toString(),
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.freeTokenAmount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.freeTokenAmount) * 2
          : parseInt(data.freeTokenAmount),
        "",
        "CC To Gold Coin",
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.gcAmount) +
              parseInt(data.gcAmount) *
                (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.gcAmount) * 2
          : parseInt(data.gcAmount),
        response,
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.freeTokenAmount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.freeTokenAmount)
          : 0
      );
      const reciptPayload = {
        username: user.username,
        email: user.email,
        walletAddress: "",
        invoicDate: 1,
        paymentMethod: "GC Purchase",
        packageName: "GoldCoin Purchase",
        goldCoinQuantity:
          findPromoData?.coupanType === "Percent"
            ? parseInt(data.gcAmount) *
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
        purcahsePrice: body.item.price.toString(),
        Tax: 0,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      await sendInvoice(reciptPayload);
      // console.log("refrenceId",user.refrenceId);
      if (body?.item?.promoCode) {
        let payload = {
          userId: user?._id,
          claimedDate: new Date(),
        };
        let promoFind = await db
          .get_scrooge_promoDB()
          .findOne({ couponCode: body.item.promoCode.trim() });
        let updatePromo = await db.get_scrooge_promoDB().findOneAndUpdate(
          { couponCode: body.item.promoCode.trim() },
          {
            $push: { claimedUser: payload },
          },
          {
            new: true,
          }
        );
      }
      if (user.refrenceId) {
        await db.get_scrooge_usersDB().findOneAndUpdate(
          { _id: ObjectId(user._id) },
          {
            $inc: {
              totalBuy: parseFloat(body?.item?.price),
              totalProfit: parseFloat(body?.item?.price),
            },
          }
        );
      }
      await db.get_scrooge_usersDB().findOneAndUpdate(
        { _id: ObjectId(user._id) },

        { $set: { isGCPurchase: true } }
      );
      let getUserDetail = await db
        .get_scrooge_usersDB()
        .findOne({ _id: ObjectId(user._id) });
      res.status(200).send({
        success: true,
        data: "Chips added successfully.",
        user: getUserDetail,
        purchaseDetails: data,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error in CC  purchase" });
  }
});

app.post(
  "/api/applyPromoCode",
  Basicauth,
  auth(),
  rateAuthLimit,
  rewards.applyPromoCode
);
app.post(
  "/api/WithdrawRequestWithFiat",
  Basicauth,
  auth(),
  rewards.WithdrawRequestWithFiat
);
app.get(
  "/api/getCryptoToGCPurcahse",
  Basicauth,
  auth(),
  rewards.getCryptoToGCPurcahse
);
app.post("/api/getFormToken", Basicauth, auth(), async (req, res) => {
  const { user, body } = req || {};

  let number = new Date().getTime();
  let firstTenDigits = number.toString().substring(0, 10);

  getAnAcceptPaymentPage(body, user, async (response) => {
    return res.send({
      code: 200,
      success: true,
      response,
    });
  });
});

app.get(
  "/api/getGCPurcahseLimitPerDay",
  Basicauth,
  auth(),
  async (req, res) => {
    const { user } = req || {};
    let userId = user._id;

    const startOfDay = new Date();
    let crrHours = startOfDay.getHours();
    let rnageDt = startOfDay.getDate();
    if (crrHours < 5) {
      startOfDay.setDate(rnageDt - 1);
      startOfDay.setHours(5, 0, 0, 0);
    } else {
      startOfDay.setHours(5, 0, 0, 0);
    }
    const endDate = new Date();
    endDate.setHours(startOfDay.getHours() + 24);

    // startOfDay.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 for the start of the day
    // startOfDay.setHours(5, 0, 0, 0);
    const query = {
      $or: [
        {
          transactionType: "CC To Gold Coin",
          "userId._id": userId,
          createdAt: { $gte: startOfDay },
        },
        {
          transactionType: "Paypal To Gold Coin",
          "userId._id": userId,
          createdAt: { $gte: startOfDay },
        },
      ],
    };
    const findTransactionIfExist = await db
      .get_scrooge_transactionDB()
      .countDocuments(query);

    return res.send({
      code: 200,
      success: true,
      findTransactionIfExist,
    });
  }
);

var q = new Queue(async function (task, cb) {
  if (task.type === "gameResult") {
    await gameResult(task.req, task.res);
  }
  cb(null, 1);
});

app.get(
  "/api/gameResult",
  Basicauth,
  auth(),
  // rateAuthLimit,
  async (req, res) => {
    try {
      q.push({ req, res, type: "gameResult" });
    } catch (error) {
      console.log("errr", error);
    }
  }
);

const gameResult = async (req, res) => {
  try {
    let { user } = req;
    user = await db.get_scrooge_usersDB().findOne({ _id: user?._id });
    if (!checkUserCanSpin(user?.lastSpinTime))
      return res.status(400).send({ msg: "Not eleigible for Spin" });
    const resp1 = await rouletteSpin.gameResult(req, user._id);
    const {
      resultData: { token },
    } = resp1;
    if (token === "Big wheel") {
      await db.get_scrooge_usersDB().updateOne(
        { _id: ObjectId(req.user._id) },
        {
          $set: {
            wheelType: "Big wheel",
          },
        }
      );
    }

    let find = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(req?.user?._id) });
    res
      .status(200)
      .send({ msg: "Success", resultData: resp1.resultData, user: find });

    if (token !== "Big wheel") {
      rouletteSpin.CreateRollOver(req, resp1, user);
      rouletteSpin.updateUserDataAndTransaction(req, resp1, user, "", {
        spinType: "Regular wheel",
      });
    }
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

var bigWheel = new Queue(async function (task, cb) {
  if (task.type === "gameResultForBigWheel") {
    await gameResultForBigWheel(task.req, task.res);
  }
  cb(null, 1);
});

app.get(
  "/api/gameResultForBigWheel",
  auth(),
  // rateAuthLimit,
  async (req, res) => {
    try {
      bigWheel.push({ req, res, type: "gameResultForBigWheel" });
    } catch (error) {
      console.log("errr", error);
    }
  }
);

const gameResultForBigWheel = async (req, res) => {
  try {
    let { user } = req;
    user = await await db.get_scrooge_usersDB().findOne({ _id: user?._id });
    if (!checkUserCanSpin(user?.lastSpinTime))
      return res.status(400).send({ msg: "Not eleigible for Spin" });
    const resp1 = await rouletteSpin.gameResultForBigWheel(req, user._id);
    res.status(200).send({ msg: "Success", resultData: resp1.resultData });
    db.get_scrooge_usersDB().updateOne(
      { _id: ObjectId(req.user._id) },
      {
        $set: {
          wheelType: "",
        },
      }
    );
    rouletteSpin.CreateRollOver(req, resp1, user);
    rouletteSpin.updateUserDataAndTransaction(req, resp1, user, "", {
      spinType: "Big wheel",
    });
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

var RegularRiskWheel = new Queue(async function (task, cb) {
  if (task.type === "gameResultForRegularRiskWheel") {
    await gameResultForRegularRiskWheel(task.req, task.res);
  }
  cb(null, 1);
});

app.get(
  "/api/gameResultForRegularRiskWheel",
  auth(),
  // rateAuthLimit,
  async (req, res) => {
    try {
      RegularRiskWheel.push({
        req,
        res,
        type: "gameResultForRegularRiskWheel",
      });
    } catch (error) {
      console.log("errr", error);
    }
  }
);

const gameResultForRegularRiskWheel = async (req, res) => {
  try {
    let { user } = req;
    user = await await db.get_scrooge_usersDB().findOne({ _id: user?._id });

    if (!checkUserCanSpin(user?.lastSpinTime))
      return res.status(400).send({ msg: "Not eleigible for Spin" });
    const resp1 = await rouletteSpin.gameResultForRegularRiskWheel(
      req,
      user._id
    );
    const { resultData } = resp1;

    if (
      resultData.token === "Green1" ||
      resultData.token === "Green2" ||
      resultData.token === "Green3"
    ) {
      await db.get_scrooge_usersDB().updateOne(
        { _id: ObjectId(req.user._id) },
        {
          $set: {
            wheelType: "Big wheel",
          },
        }
      );
    }
    let find = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(req?.user?._id) });
    res
      .status(200)
      .send({ msg: "Success", resultData: resp1.resultData, user: find });

    const {
      resultData: { token },
    } = resp1;
    if (token !== "Green1" && token !== "Green2" && token !== "Green3") {
      await rouletteSpin.updateUserDataAndTransaction(req, resp1, user, "", {
        spinType: "Regular Risk wheel",
      });
    }
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

var riskWheel = new Queue(async function (task, cb) {
  if (task.type === "gameResultForRiskWheel") {
    await gameResultForRiskWheel(task.req, task.res);
  }
  cb(null, 1);
});

app.get(
  "/api/gameResultForRiskWheel",
  auth(),
  // rateAuthLimit,
  async (req, res) => {
    try {
      riskWheel.push({ req, res, type: "gameResultForRiskWheel" });
    } catch (error) {
      console.log("errr", error);
    }
  }
);

const gameResultForRiskWheel = async (req, res) => {
  try {
    let { user } = req;
    user = await await db.get_scrooge_usersDB().findOne({ _id: user?._id });
    if (!checkUserCanSpin(user?.lastSpinTime))
      return res.status(400).send({ msg: "Not eleigible for Spin" });
    const resp1 = await rouletteSpin.gameResultForRiskWheel(req, user._id);
    res.status(200).send({ msg: "Success", resultData: resp1.resultData });

    const {
      resultData: { token },
    } = resp1;
    if (token !== "Green1" && token !== "Green2") {
      await rouletteSpin.updateUserDataAndTransaction(req, resp1, user, "", {
        spinType: "Risk wheel",
      });
      console.log("helloooo");
    }
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

var loyalityWheel = new Queue(async function (task, cb) {
  if (task.type === "loyalitygameResultWheel") {
    await loyalitygameResultWheel(task.req, task.res);
  }
  cb(null, 1);
});

app.get(
  "/api/loyalitygameResult",
  auth(),
  // rateAuthLimit,
  async (req, res) => {
    try {
      loyalityWheel.push({ req, res, type: "loyalitygameResultWheel" });
    } catch (error) {
      console.log("errr", error);
    }
  }
);

const loyalitygameResultWheel = async (req, res) => {
  try {
    let { user } = req;
    user = await await db.get_scrooge_usersDB().findOne({ _id: user?._id });
    if (!checkUserCanSpin(user?.lastSpinTime))
      return res.status(400).send({ msg: "Not eleigible for Spin" });
    const resp1 = await rouletteSpin.loyalitygameResultWheel(req, user._id);
    rouletteSpin.CreateRollOver(req, resp1, user);
    rouletteSpin.updateUserDataAndTransaction(req, resp1, user, "Loyality", {
      spinType: "Loyality wheel",
    });
    res.status(200).send({ msg: "Success", resultData: resp1.resultData });
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

var MegaWheel = new Queue(async function (task, cb) {
  if (task.type === "MegaWheelgameResult") {
    await MegaWheelgameResult(task.req, task.res);
  }
  cb(null, 1);
});
app.get(
  "/api/MegaWheelgameResult",
  auth(),
  // rateAuthLimit,
  async (req, res) => {
    try {
      MegaWheel.push({ req, res, type: "MegaWheelgameResult" });
    } catch (error) {
      console.log("errr", error);
    }
  }
);

const MegaWheelgameResult = async (req, res) => {
  try {
    let { user } = req;
    user = await await db.get_scrooge_usersDB().findOne({ _id: user?._id });
    if (!checkUserCanSpin(user?.lastSpinTime))
      return res.status(400).send({ msg: "Not eleigible for Spin" });
    const resp1 = await rouletteSpin.MegaWheelgameResult(req, user._id);
    rouletteSpin.CreateRollOver(req, resp1, user);
    rouletteSpin.updateUserDataAndTransaction(req, resp1, user, "Megawheel", {
      spinType: "Mega wheel",
    });
    res.status(200).send({ msg: "Success", resultData: resp1.resultData });
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

app.get(
  "/api/fastWithdrawRedeem/:withdraw_id/:transactionHash",
  rewards.FastWithdrawRedeem
);
app.get("/api/getWeeklyWheel", auth(), rewards.getWeeklyWheel);

app.get(
  "/api/getMegaBuyPurcahseLimitPerDay",
  Basicauth,
  auth(),
  async (req, res) => {
    const { user } = req || {};

    let userId = user._id;
    const startOfDay = new Date();

    startOfDay.setDate(
      user?.megaOffer?.length >= 3
        ? startOfDay.getDate() - 3
        : user?.megaOffer?.includes(99.99)
        ? startOfDay.getDate() - 7
        : startOfDay.getDate() - 1
    );

    startOfDay.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 for the start of the day
    const query = {
      transactionType: {
        $in: ["CC To Gold Coin", "Crypto To Gold Coin", "Paypal To Gold Coin"],
      },
      "userId._id": userId,
      purchasedAmountInUSD: {
        $in: [9.99, 19.99, 24.99, 4.99, 14.99, 49.99, 99.99],
      },
      createdAt: { $gt: startOfDay },
    };

    const findTransactionIfExist = await db
      .get_scrooge_transactionDB()
      .findOne(query, { sort: { _id: -1 } });

    return res.send({
      code: 200,
      success: true,
      toShowBuyMega: findTransactionIfExist ? false : true,
    });
  }
);

app.get(
  "/api/getAdminSettings",
  Basicauth,

  async (req, res) => {
    let getAdminSettings = await db.get_db_admin_settingDB().findOne({});
    return res.send({
      code: 200,
      success: true,
      adminSettings: getAdminSettings,
    });
  }
);
app.post(
  "/api/redeemFreePromoST",
  Basicauth,
  auth(),
  rewards.redeemFreePromoST
);

function getMinutesDifference(date1, date2) {
  // Parse the dates if they're not already Date objects
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Calculate the difference in milliseconds
  const diffInMs = Math.abs(d2 - d1);

  // Convert milliseconds to minutes
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  return diffInMinutes;
}

app.post("/api/auth-make-payment", auth(), async (req, res) => {
  try {
    let { user, body } = req || {};
    const dcryptdData = decryptData(body?.data);
    console.log("user", user);

    console.log("dcryptdData ==>", dcryptdData);
    body = dcryptdData;
    const timeToRequest = new Date(dcryptdData.time);
    const extractedId = user._id;
    const extractedPromoCode = body?.promoCode || null;
    const extractedReffrenceId = user?.refrenceId || null;

    let number = new Date().getTime();
    let firstTenDigits = number.toString().substring(0, 10);

    const minsDiffrence = getMinutesDifference(timeToRequest, new Date());
    console.log("minutesToDiffrenect ", minsDiffrence);

    if (
      user.firstName !== dcryptdData?.firstName ||
      user.lastName !== dcryptdData?.lastName
    ) {
      return res.status(400).send({
        success: false,
        message: "First name and Last name mismatch from user profile.",
      });
    }

    if (minsDiffrence > 5) {
      return res
        .status(400)
        .send({ success: false, data: "Purchase Not Authorized" });
    }

    if (user?.isBlockWallet) {
      return res
        .status(400)
        .send({ success: false, data: "Your wallet blocked by admin" });
    }

    let fullName = user?.firstName + " " + user?.lastName;

    const ipAddress = ip.getClientIp(req);

    const crdNumber = body?.cardNumber; //decryptData(b);
    body.cardNumber = crdNumber;

    var requestData = {
      ANID: "",
      AUTH: "A",
      CURR: "USD",
      EMAL: user?.email,
      NAME: fullName,
      IPAD: ipAddress,
      MACK: "Y",
      MERC: process.env.KOUNT_MERCHID,
      MODE: "Q",
      PTOK: body?.cardNumber,
      PTYP: "CARD",
      SESS: body?.sessionId?.sessionID,
      SITE: "SCROOGE",
      VERS: "0720",
      EPOC: firstTenDigits,
      TOTL: parseFloat((body?.amount * 100).toFixed(2)),
      B2A1: body?.streetAddress,
      B2CI: body?.city,
      B2ST: body?.state,
      B2PC: body?.zipCode,
      B2CC: body?.country,
      B2PN: body?.phoneNumber,
      UNIQ: user?.username,
      "PROD_DESC[0]": "CC To Gold Coin",
      "PROD_ITEM[0]": "CC To Gold Coin",
      "PROD_PRICE[0]": parseFloat((body?.amount * 100).toFixed(2)),
      "PROD_QUANT[0]": 1,
      "PROD_TYPE[0]": "CC To Gold Coin",
    };

    utilities.makeApiRequest(requestData, function (err, response) {
      if (err) {
        console.error("Error:", err);
      } else {
        const modeRegex = /MODE=([^\n]+)/;
        const authRegex = /AUTO=([^\n]+)/;

        const modeMatch = response.match(modeRegex);
        const autoMatch = response.match(authRegex);

        let modes = modeMatch ? modeMatch[1] : null;
        const auto = autoMatch ? autoMatch[1] : null;

        if (modes !== "Q") {
          return res.status(400).send({
            success: false,
            message: "Transaction Declined. Reason code: K",
          });
        }

        if (auto === "D") {
          return res.status(400).send({
            success: false,
            message: "Transaction Declined. Reason code: K",
          });
        }

        createAuthCustomAnAcceptPaymentTransaction(
          req,
          body,
          user,
          async (response) => {
            // console.log("response", response.messages.resultCode);
            if (
              response.messages.resultCode !== "Ok" ||
              response.transactionResponse?.errors
            ) {
              return res.status(400).send({
                success: false,
                data: "transaction failed",
                error:
                  response.transactionResponse?.errors?.error[0]?.errorText,
              });
            }
            const getUser = await db
              .get_scrooge_usersDB()
              .findOne({ _id: ObjectId(user?._id) });
            if (!getUser) {
              return;
            }

            if (body?.amount) {
              const data = await db.get_marketplace_gcPackagesDB().findOne({
                priceInBUSD: body?.amount?.toString(),
              });

              if (data) {
                const findTransactionIfExist = await db
                  .get_scrooge_transactionDB()
                  .find({
                    "transactionDetails.transaction.transId":
                      response?.transactionResponse?.transId,
                  })
                  .toArray();

                if (findTransactionIfExist.length === 0) {
                  let query = {
                    couponCode: extractedPromoCode,
                    expireDate: { $gte: new Date() },
                  };
                  let findPromoData = await db
                    .get_scrooge_promoDB()
                    .findOne(query);

                  // console.log("findPromoData", findPromoData);
                  const trans = await rewards.addChips(
                    getUser?._id?.toString(),
                    findPromoData?.coupanType === "Percent"
                      ? parseInt(data.freeTokenAmount) +
                          parseInt(data.freeTokenAmount) *
                            (parseFloat(findPromoData?.discountInPercent) / 100)
                      : findPromoData?.coupanType === "2X"
                      ? parseInt(data.freeTokenAmount) * 2
                      : parseInt(data.freeTokenAmount),
                    "",
                    "CC To Gold Coin",
                    findPromoData?.coupanType === "Percent"
                      ? parseInt(data.gcAmount) +
                          parseInt(data.gcAmount) *
                            (parseFloat(findPromoData?.discountInPercent) / 100)
                      : findPromoData?.coupanType === "2X"
                      ? parseInt(data.gcAmount) * 2
                      : parseInt(data.gcAmount),
                    response,
                    findPromoData?.coupanType === "Percent"
                      ? parseInt(data.freeTokenAmount) *
                          (parseFloat(findPromoData?.discountInPercent) / 100)
                      : findPromoData?.coupanType === "2X"
                      ? parseInt(data.freeTokenAmount)
                      : 0,
                    body?.amount //amount?.toString() === "9.99"
                    // ? 1500
                    // : 0
                  );

                  const reciptPayload = {
                    username: getUser?.username,
                    email: getUser?.email,
                    invoicDate: moment(new Date()).format("D MMMM  YYYY"),
                    paymentMethod: "Credit Card Purchase",
                    packageName: "Gold Coin Purchase",
                    goldCoinQuantity: parseInt(data?.gcAmount),
                    tokenQuantity: parseInt(data?.freeTokenAmount),
                    purcahsePrice: body?.amount?.toString(),
                    Tax: 0,
                    firstName: getUser?.firstName,
                    lastName: getUser?.lastName,
                  };
                  if (data?.offerType === "MegaOffer") {
                    await db.get_scrooge_usersDB().findOneAndUpdate(
                      { _id: ObjectId(extractedId) },

                      { $push: { megaOffer: parseFloat(body?.amount) } }
                    );
                  }
                  if (data?.offerType === "freeSpin") {
                    let freeSpinPayload = {
                      amount: data?.numberofSpins,
                      currency: data.currency,
                      freespinvalue: data?.freespinValue,
                      gameid: data?.freeSpinGame,
                      remoteusername: extractedId,
                    };
                    let spinRes = createFreeSpin(freeSpinPayload);
                    await db.get_scrooge_usersDB().findOneAndUpdate(
                      { _id: ObjectId(extractedId) },

                      { $push: { freeSpin: parseFloat(body?.amount) } }
                    );
                  }

                  const result = await db
                    .get_scrooge_usersDB()
                    .findOneAndUpdate(
                      { _id: ObjectId(extractedId) },
                      { $set: { isSpended: true } }
                    );

                  // console.log("ssss", result);

                  await InvoiceEmail(getUser?.email, reciptPayload);
                  if (extractedPromoCode) {
                    let payload = {
                      userId: extractedId,
                      claimedDate: new Date(),
                    };

                    let promoFind = await db
                      .get_scrooge_promoDB()
                      .findOne({ couponCode: extractedPromoCode.trim() });
                    await db.get_scrooge_promoDB().findOneAndUpdate(
                      { couponCode: extractedPromoCode.trim() },
                      {
                        $push: { claimedUser: payload },
                      },
                      {
                        new: true,
                      }
                    );
                  }
                  if (extractedReffrenceId) {
                    getGCPurchaseAffliateBonus(
                      extractedId,
                      extractedReffrenceId,
                      parseFloat(body?.amount)
                    );
                  }
                }
              }

              return res.status(200).send({
                success: true,
                message: "Chips added successfully.",
                user: getUser,
                package: data,
              });
            }
          }
        );
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error in CC  purchase" });
  }
});

app.post("/api/capture-paypal-order", Basicauth, auth(), rewards.paypalOrder);

app.post("/api/IdAnalyzerWithDocupass", auth(), rewards.IdAnalyzerWithDocupass);
app.post(
  "/api/saveUserconnectedWallet",
  Basicauth,
  auth(),
  rewards.saveUserconnectedWallet
);

app.listen(PORT, () => {
  console.log("Server is running.", PORT);
});

const prevDt = new Date();
prevDt.setDate(prevDt.getDate() - 1);
prevDt.setHours(0, 0, 0, 0);
const estOffset = -5 * 60; // EST is UTC-5
const nowEst = new Date(prevDt.getTime() + estOffset * 60 * 1000);

export default app;
