import express, { json } from "express";
import * as db from "./config/mongodb.mjs";
import * as rewards from "./config/rewards.mjs";
import * as affiliate from "./config/affiliate.mjs";
import * as useSDK from "./config/sdk.mjs";
import * as raffles from "./raffles/raffles.mjs";
import * as sharable from "./config/sharable_data.mjs";
import * as email from "./email/email.mjs";
import * as chatgpt from "./config/chatgpt.mjs";
import * as common from "./config/commons.mjs";
import * as utilities from "./config/utilities.mjs";
import { processStripeWebhook } from "./config/stripe.mjs";
import cors from "cors";
const app = express();
const PORT = process.env.PORT;
app.use(cors('*'));
app.use(json());
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
    !db.get_raffles_usersDB()
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
app.get("/api/getAffiliateUser/:user_id", affiliate.getAffiliateUser);

// Route to create Affiliate user
app.get(
  "/api/createAffiliateUser/:user_id/:ip_address",
  affiliate.createAffiliateUser
);

// Route to get affiliate leaders by number of tokens earned
app.get(
  "/api/getAffLeadersByTokens/:limit/:days",
  affiliate.getAffLeadersByTokens
);

// Route to get affiliate leaders by number of commissions (num of sales) earned
app.get(
  "/api/getAffLeadersByCount/:limit/:days",
  affiliate.getAffLeadersByCount
);

// Route to get affiliate leaders by number of commissions (num of sales) earned
app.get(
  "/api/getAffLeadersByType/:type/:limit/:days",
  affiliate.getAffLeadersByType
);

//################################# Common Data #################################//

//################################# Email #################################//
// Route to trigger email
app.get("/api/sendEmail/:to/:subject/:body", async (req, res) => {
  const resp = await email.sendemail(req).then((data) => {
    res.send(data);
  });
});

//################################# Items #################################//
app.get(
  "/api/getFreeTokens/:address/:token_id/:user_id/:qty/:aff_id",
  async (req, res) => {
    const resp = await useSDK.getFreeTokens(req).then((data) => {
      res.send(data);
    });
  }
);

app.get("/api/getItems/:type", async (req, res) => {
  const resp = await rewards.getItems(req).then((data) => {
    res.send(data);
  });
});

//################################# Prizes #################################//
// Route to get available prizes
app.get("/api/getPrizes", async (req, res) => {
    console.log("abcccc");
  const resp = await rewards.getPrizes(req).then((data) => {
    console.log('prizes resp: ', data);
    res.send(data);
  });
});

// Route to get user's redeemed prizes
app.get("/api/getUserRedeemed/:user_id", async (req, res) => {
  const resp = await rewards.getUserRedeemed(req).then((data) => {
    res.send(data);
  });
});

// Route to update markRedeemed flag in prize_redeem_transactions table
app.get("/api/markMerchCouponRedeemed/:trans_id/:user_id", async (req, res) => {
  const resp = await rewards.markMerchCouponRedeemed(req).then((data) => {
    res.send(data);
  });
});

// Route to redeem prize
app.get("/api/redeemPrize/:address/:user_id/:prize_id", async (req, res) => {
  console.log("req", req.params);
  const resp = await rewards.redeemPrize(req).then((data) => {
    console.log("res", data);
    res.send(data);
  });
});

//################################# Raffles #################################//
// Route to get current raffles
app.get("/api/getCurrentRaffles/:limit/:days", async (req, res) => {
  const resp = await raffles.getCurrentRaffles(req).then((data) => {
    res.send(data);
  });
});

// Route to get finished raffles
app.get("/api/getFinishedRaffles/:limit/:days", async (req, res) => {
  const resp = await raffles.getFinishedRaffles(req).then((data) => {
    res.send(data);
  });
});

// Route to get entries by raffle ID
app.get(
  "/api/getEntriesByRaffleID/:raffle_id/:limit/:days",
  async (req, res) => {
    const resp = await raffles.getEntriesByRaffleID(req).then((data) => {
      res.send(data);
    });
  }
);

// Route to get entries count by raffle ID
app.get("/api/getEntriesCountByRaffleID/:raffle_id", async (req, res) => {
  const resp = await raffles.getEntriesCountByRaffleID(req).then((data) => {
    res.send(data);
  });
});

// Route to get entries by user ID
app.get("/api/getEntriesByUserID/:user_id/:limit/:days", async (req, res) => {
  const resp = await raffles.getEntriesByUserID(req).then((data) => {
    res.send(data);
  });
});

// Route to get draw by raffle ID
app.get("/api/getDrawByRaffleID/:raffle_id", async (req, res) => {
  const resp = await raffles.getDrawByRaffleID(req).then((data) => {
    res.send(data);
  });
});

// Route to get prize by prize ID
app.get("/api/getDrawByRaffleID/:prize_id", async (req, res) => {
  const resp = await raffles.getPrizeByPrizeID(req).then((data) => {
    res.send(data);
  });
});

// Route to enter raffle
app.get("/api/enterRaffle/:raffle_id/:user_id/:address", async (req, res) => {
  const resp = await raffles.enterRaffle(req).then((data) => {
    res.send(data);
  });
});

// Route to get amount of user's raffle tickets
app.get("/api/getUserRaffleTickets/:user_id", async (req, res) => {
  const resp = await raffles.getUserRaffleTickets(req).then((data) => {
    res.send(data);
  });
});

// Route to intialize raffle purchase event
app.get(
  "/api/initEntryPurchase/:user_id/:address/:amt/:item_id",
  async (req, res) => {
    const resp = await raffles.initEntryPurchase(req).then((data) => {
      res.send(data);
    });
  }
);

// Route to finalize raffle purchase event
app.get(
  "/api/finalizeEntryPurchase/:user_id/:address/:amt/:purchase_id/:trans_hash",
  async (req, res) => {
    const resp = await raffles.finalizeEntryPurchase(req).then((data) => {
      res.send(data);
    });
  }
);

//################################# Rewards #################################//
// Route to get last claim date
app.get(
  "/api/getNextClaimDate/:address/:type/:user_id/:token_id",
  rewards.getNextClaimDate
);

// Route to claim DL Tokens
app.get("/api/claimDLTokens/:address/:user_id/:token_id", async (req, res) => {
  const resp = await rewards.claimDLTokens(req).then((data) => {
    res.send(data);
  });
});

// Route to claim daily rewards
app.get("/api/claimDailyRewards/:user_id", async (req, res) => {
  const resp = await rewards.claimDailyRewards(req).then((data) => {
    res.send(data);
  });
});

// Route to claim holder monthly Tokens
app.get("/api/claimHolderTokens/:address/:user_id", async (req, res) => {
  const resp = await rewards.claimHolderTokens(req).then((data) => {
    res.send(data);
  });
});

//################################# Sharable Data #################################//
// Route to get Sharable Messages
app.get("/api/getSharableMessages", sharable.getSharableMessages);

// Route to get shortened link
app.get("/api/getShortLink/:link", sharable.getShortLink);

// Route to get AI message
app.get("/api/getAIMessage/:prompt/:user_id/:type", async (req, res) => {
  const resp = await chatgpt.getAIMessage(req).then((data) => {
    res.send(data);
  });
});

//################################# Stripe #################################//
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  (request, response) => {
    const res = processStripeWebhook(request);
    response.send();
  }
);

//################################# User #################################//

//################################# Utilities #################################//
app.get("/api/decrypt/:text", (req, res) => {
  const resp = utilities.decrypt(req);
  res.send(resp);
});

app.get("/api/encrypt/:text", (req, res) => {
  const resp = utilities.encrypt(req);
  res.send(resp);
});

//################################# Wallet #################################//
// Route to get OG Balance
app.get("/api/getOGBalance/:address", async (req, res) => {
  const resp = await useSDK.getOGBalance(req).then((data) => {
    res.send(data);
  });
});

// Route to get user's NFT balance
app.get(
  "/api/getWalletNFTBalanceByTokenID/:address/:token_id/:user_id/:qty",
  async (req, res) => {
    const resp = await useSDK.getWalletNFTBalanceByTokenID(req).then((data) => {
      res.send(data);
    });
  }
);

// Route to get wallet DL data
app.get("/api/getWalletDLBalance/:address", async (req, res) => {
  const resp = await useSDK.getWalletDLBalance(req).then((data) => {
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log("Server is running.",PORT);
});

export default app;
