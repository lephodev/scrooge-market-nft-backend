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

      "https://beta.scrooge.casino",
      "https://betapoker.scrooge.casino",
      "https://betaslot.scrooge.casino",
      "https://betablackjack.scrooge.casino",
      "https://betaadmin.scrooge.casino",
      "https://betamarket.scrooge.casino",
      "https://betaroulette.scrooge.casino",
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
  console.log("abcccc");
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
    console.log("reee", request.query, request.params, request.body);
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
  rateAuthLimit,
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
    user = await await db.get_scrooge_usersDB().findOne({ _id: user?._id });
    if (!checkUserCanSpin(user?.lastSpinTime))
      return res.status(400).send({ msg: "Not eleigible for Spin" });
    const resp1 = await rouletteSpin.gameResult(req, user._id);
    res.status(200).send({ msg: "Success", resultData: resp1.resultData });
    rouletteSpin.CreateRollOver(req, resp1, user);
    rouletteSpin.updateUserDataAndTransaction(req, resp1, user);
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

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
  let affliateData = await db
    .get_affiliatesDB()
    .findOne({ userId: extractedId });
  let getAdminSettings = await db.get_db_admin_settingDB().findOne({});
  const { cryptoToGcReferalBonus } = getAdminSettings;
  let getTicketBonus = (cryptoToGcReferalBonus / 100) * parseInt(amount * 100);
  console.log("getTicketBonus", getTicketBonus, amount, cryptoToGcReferalBonus);
  let affliateUserDetails = {
    commission: getTicketBonus,
    monthly_earned: getTicketBonus,
    referred_user_id: ObjectId(extractedReffrenceId),
    affiliate_id: affliateData?._id || null,
    userId: ObjectId(extractedId),
    transactionType: "crypto to Gc refferal",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.get_db_affiliates_transactionDB().insertOne(affliateUserDetails);
  let getUser = await db.get_scrooge_usersDB().findOneAndUpdate(
    { _id: ObjectId(extractedReffrenceId) },
    {
      $inc: { wallet: getTicketBonus },
    },
    { new: true }
  );

  db.get_affiliatesDB().findOneAndUpdate(
    { userId: ObjectId(extractedReffrenceId) },
    {
      $inc: {
        total_earned: getTicketBonus,
        monthly_earned: getTicketBonus,
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

  let getUserData = await db
    .get_scrooge_usersDB()
    .findOne({ _id: ObjectId(extractedReffrenceId) });
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
  await db.get_scrooge_transactionDB().insertOne(transactionPayload);
};

app.post("/api/authorize-webhook", async (req, res) => {
  try {
    const rawPayload = JSON.stringify(req.body);
    console.log("rawPayload", rawPayload);

    getTransactionDetails(rawPayload, async (response) => {
      try {
        console.log("response528", response);
        const amount = response?.transaction?.settleAmount;
        const email = response?.transaction?.customer?.email;
        // const emailAndIdRegex = /^(.+?)_(\w+)$/;
        // const match = email.match(emailAndIdRegex);
        // console.log("email", email);
        var parts = email.split("_");

        if (parts) {
          // Extract each part
          const extractedId = parts[0] || null;
          const extractedPromoCode = parts[1] || null;
          const extractedReffrenceId = parts[2] || null;

          console.log("extractedId:", extractedId);
          console.log("extractedPromoCode:", extractedPromoCode);
          console.log("extractedReffrenceId", extractedReffrenceId);

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
          const getUser = await db
            .get_scrooge_usersDB()
            .findOne({ _id: ObjectId(extractedId) });
          if (!getUser) {
            console.log("User Not Found");
            return;
          }
          if (amount) {
            const data = await db.get_marketplace_gcPackagesDB().findOne({
              priceInBUSD: amount?.toString(),
            });
            console.log("data", data);
            if (data) {
              const findTransactionIfExist = await db
                .get_scrooge_transactionDB()
                .find({
                  "transactionDetails.transaction.transId":
                    response?.transaction?.transId,
                })
                .toArray();
              console.log("findTransactionIfExist", findTransactionIfExist);

              if (findTransactionIfExist.length === 0) {
                let query = {
                  couponCode: extractedPromoCode,
                  expireDate: { $gte: new Date() },
                };
                let findPromoData = await db
                  .get_scrooge_promoDB()
                  .findOne(query);
                console.log("findPromoData", findPromoData);
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
                    : 0
                );
                const reciptPayload = {
                  username: getUser?.username,
                  email: getUser?.email,
                  invoicDate: moment(new Date()).format("D MMMM  YYYY"),
                  paymentMethod: "GC Purchase",
                  packageName: "Gold Coin Purchase",
                  goldCoinQuantity: parseInt(data?.gcAmount),
                  tokenQuantity: parseInt(data?.freeTokenAmount),
                  purcahsePrice: amount?.toString(),
                  Tax: 0,
                  firstName: getUser?.firstName,
                  lastName: getUser?.lastName,
                };
                await db.get_scrooge_usersDB().findOneAndUpdate(
                  { _id: ObjectId(extractedId) },

                  { $set: { isGCPurchase: true } }
                );
                await InvoiceEmail(getUser?.email, reciptPayload);
                if (extractedPromoCode) {
                  let payload = {
                    userId: extractedId,
                    claimedDate: new Date(),
                  };
                  console.log("promoCode", extractedPromoCode);
                  console.log("payload", payload);
                  let promoFind = await db
                    .get_scrooge_promoDB()
                    .findOne({ couponCode: extractedPromoCode.trim() });
                  console.log("promoFind", promoFind);
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
                console.log(
                  "extractedReffrenceIdextractedReffrenceIdextractedReffrenceId",
                  typeof extractedReffrenceId,
                  extractedReffrenceId
                );
                if (extractedReffrenceId !== "null") {
                  getGCPurchaseAffliateBonus(
                    extractedId,
                    extractedReffrenceId,
                    amount
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("error", error);
      }
    });
    res.status(200).send({
      success: true,
      data: "Chips added successfully.",
    });
  } catch (error) {
    console.log("webhook err", error);
    res.status(200).json({
      message: "Something went wrong",
    });
  }
  // res.send({ success: true });
});

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
  console.log("hello console");
  try {
    const { user, body } = req || {};
    console.log("body", body);
    if (user?.isBlockWallet) {
      return res
        .status(400)
        .send({ success: false, data: "Your wallet blocked by admin" });
    }
    console.log();
    const binStr = new RegExp(`^${body.bin}`, "gm");
    console.log("binStr", binStr);
    const bin = await db.get_scrooge_bin().findOne({
      binNumber: binStr,
    });

    console.log("bin", bin);

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
      console.log("response", response.messages.resultCode);
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
      console.log("Body With CC ", body.item.promoCode);
      if (body?.item?.promoCode) {
        let payload = {
          userId: user?._id,
          claimedDate: new Date(),
        };
        console.log("promoCode CC", body.item.promoCode);
        console.log("payload CC", payload);
        let promoFind = await db
          .get_scrooge_promoDB()
          .findOne({ couponCode: body.item.promoCode.trim() });
        console.log("promoFind With CC", promoFind);
        let updatePromo = await db.get_scrooge_promoDB().findOneAndUpdate(
          { couponCode: body.item.promoCode.trim() },
          {
            $push: { claimedUser: payload },
          },
          {
            new: true,
          }
        );
        console.log(
          "updatePromoupdatePromoupdatePromo with Creadit card",
          updatePromo
        );
      }
      if (user.refrenceId) {
        await db.get_scrooge_usersDB().findOneAndUpdate(
          { _id: ObjectId(user._id) },
          {
            $inc: {
              totalBuy: parseInt(body.item.price),
              totalProfit: parseInt(body.item.price),
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
  // console.log("user", user);

  if (user) {
    // const query = {
    //   transactionType: "CC To Gold Coin",
    //   "userId._id": ObjectId(user?._id),
    // };

    // const latestTransaction = await db
    //   .get_scrooge_transactionDB()
    //   .findOne(query, { sort: { _id: -1 } });
    // console.log("latestTransaction", latestTransaction);

    // if (
    //   latestTransaction &&
    //   // new Date() - latestTransaction.createdAt < 3 * 60 * 1000 // 60 seconds * 1000 milliseconds
    // ) {

    //   const crrDt = new Date();
    //   const cretedDt = new Date(latestTransaction.createdAt);
    //   crrDt.setMinutes(crrDt.getMinutes() - 1);
    //   const crrTime = crrDt.getTime();
    //   const cretedTime = cretedDt

    //   return res.send({
    //     code: 400,
    //     success: false,
    //     message: "You cannot make another transaction within a minute.",
    //   });
    // }

    getAnAcceptPaymentPage(body, user, async (response) => {
      return res.send({
        code: 200,
        success: true,
        response,
      });
    });
  }
});

app.get(
  "/api/getGCPurcahseLimitPerDay",
  Basicauth,
  auth(),
  async (req, res) => {
    const { user } = req || {};
    let userId = user._id;

    console.log("getGCPurcahseLimitPerDay", userId);
    const startOfDay = new Date();
    console.log("startOfDay-------", startOfDay);
    startOfDay.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 for the start of the day

    console.log("startOfDay", startOfDay);
    const query = {
      transactionType: "CC To Gold Coin",
      "userId._id": userId,
      createdAt: { $gte: startOfDay },
    };
    const findTransactionIfExist = await db
      .get_scrooge_transactionDB()
      .countDocuments(query);
    console.log("findTransactionIfExist", findTransactionIfExist);

    return res.send({
      code: 200,
      success: true,
      findTransactionIfExist,
    });
  }
);

app.listen(PORT, () => {
  console.log("Server is running.", PORT);
});

export default app;
