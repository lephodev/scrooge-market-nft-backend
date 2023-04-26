import express, { json } from 'express';
//import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
/*import connectToDB, {uri,conn, client, get_scrooge_usersDB, get_affiliatesDB, get_affiliates_successful_actionsDB, get_marketplace_chip_transactionsDB,
    get_marketplace_coupons_merchDB, get_marketplace_daily_reward_token_claimsDB, get_marketplace_ducky_lucks_chip_claimsDB, get_marketplace_ducky_lucks_prizesDB,
    get_marketplace_holder_claim_chips_transactionsDB, get_marketplace_itemsDB, get_marketplace_prizesDB, get_marketplace_redeem_prize_transactionsDB,
    get_marketplace_wallet_addressesDB, get_common_batch_burn_transactionsDB, get_common_burn_requestsDB, get_common_common_totalsDB, get_rafflesDB,
    get_raffles_drawsDB, get_raffles_entriesDB, get_sharing_hashtagsDB, get_sharing_messagesDB, get_sharing_responsesDB, get_sharing_twitterInfluencersDB,
    get_user_details_casino_profile_pointsDB } from './config/mongodb.mjs';*/
import * as db from './config/mongodb.mjs';
import * as rewards from './config/rewards.mjs'
import * as affiliate from './config/affiliate.mjs'
import * as sdk from './config/sdk.mjs';
import * as raffles from './raffles/raffles.mjs';
import * as sharable from './config/sharable_data.mjs';
import * as email from './email/email.mjs';
import { processStripeWebhook } from './config/stripe.mjs';
//import { ThirdwebSDK } from '@thirdweb-dev/sdk/evm';
import cors from 'cors';
//import fetch from 'node-fetch';
//import affAddOrder, {getAffiliateUser} from './config/affiliate.mjs';
//import dotenv from 'dotenv';
//const envconfig = dotenv.config();
const app = express();
const PORT = 9001;
app.use(cors());
app.use(json());
app.use(async (req, res, next) => {
    if (!db.get_scrooge_usersDB()) {
        await db.connectToDB();
    }
    if (!db.get_affiliatesDB()) {
        await db.connectToDB();
    }
    next();
});


//################################# Affiliates #################################//
// Route to get Affiliate user
app.get("/api/getAffiliateUser/:user_id", async (req,res)=>{
    const resp = await affiliate.getAffiliateUser(req);
    res.send(resp);
});

// Route to create Affiliate user
app.get("/api/createAffiliateUser/:user_id/:ip_address", async (req,res)=>{
    const resp = await affiliate.createAffiliateUser(req);
    res.send(resp);
});




//################################# Common Data #################################//


//################################# Email #################################//
// Route to trigger email
app.get("/api/sendEmail/:to/:subject/:body", async (req,res)=>{
    const resp = await email.sendemail(req);
    res.send(resp);
});


//################################# Items #################################//
// app.get("/api/getFreeTokens/:address/:token_id/:user_id/:qty/:aff_id", async (req,res)=>{
//     const resp = await sdk.getFreeTokens(req);
//     res.send(resp);
// });



//################################# Prizes #################################//
// Route to get available prizes
app.get("/api/getPrizes", async (req,res)=>{
    const resp = await rewards.getPrizes(req);
    res.send(resp);
});

// Route to get user's redeemed prizes
app.get("/api/getUserRedeemed/:user_id", async (req,res)=>{
    const resp = await rewards.getUserRedeemed(req);
    res.send(resp);
});

// Route to update markRedeemed flag in prize_redeem_transactions table
app.get("/api/markMerchCouponRedeemed/:trans_id/:user_id", async (req,res)=>{
    const resp = await rewards.markMerchCouponRedeemed(req);
    res.send(resp);
});

// Route to redeem prize
app.get("/api/redeemPrize/:address/:user_id/:prize_id", async (req,res)=>{
    const resp = await rewards.redeemPrize(req);
    res.send(resp);
});



//################################# Raffles #################################//
// Route to get current raffles
app.get("/api/getCurrentRaffles/:limit/:days", async (req,res)=>{
    const resp = await raffles.getCurrentRaffles(req);
    res.send(resp);
});

// Route to get finished raffles
app.get("/api/getFinishedRaffles/:limit/:days", async (req,res)=>{
    const resp = await raffles.getFinishedRaffles(req);
    res.send(resp);
});

// Route to get entries by raffle ID
app.get("/api/getEntriesByRaffleID/:raffle_id/:limit/:days", async (req,res)=>{
    const resp = await raffles.getEntriesByRaffleID(req);
    res.send(resp);
});

// Route to get entries count by raffle ID
app.get("/api/getEntriesCountByRaffleID/:raffle_id", async (req,res)=>{
    const resp = await raffles.getEntriesCountByRaffleID(req);
    res.send(resp);
});

// Route to get entries by user ID
app.get("/api/getEntriesByUserID/:user_id/:limit/:days", async (req,res)=>{
    const resp = await raffles.getEntriesByUserID(req);
    res.send(resp);
});

// Route to get draw by raffle ID
app.get("/api/getDrawByRaffleID/:raffle_id", async (req,res)=>{
    const resp = await raffles.getDrawByRaffleID(req);
    res.send(resp);
});

// Route to get prize by prize ID
app.get("/api/getDrawByRaffleID/:prize_id", async (req,res)=>{
    const resp = await raffles.getPrizeByPrizeID(req);
    res.send(resp);
});

// Route to enter raffle
// app.get("/api/enterRaffle/:raffle_id/:user_id/:address", async (req,res)=>{
//     const resp = await raffles.enterRaffle(req);
//     res.send(resp);
// });




//################################# Rewards #################################//
// Route to get last claim date
app.get("/api/getNextClaimDate/:address/:type/:user_id/:token_id", async (req,res)=>{
    const resp = await rewards.getNextClaimDate(req);
    res.send(resp);
});

// Route to claim DL Tokens
app.get("/api/claimDLTokens/:address/:user_id/:token_id", async (req,res)=>{
    const resp = await rewards.claimDLTokens(req);
    res.send(resp);
});

// Route to claim daily rewards
app.get("/api/claimDailyRewards/:user_id", async (req,res)=>{
    const resp = await rewards.claimDailyRewards(req);
    res.send(resp);
});

// Route to claim holder monthly Tokens
app.get("/api/claimHolderTokens/:address/:user_id", async (req,res)=>{
    const resp = await rewards.claimHolderTokens(req);
    res.send(resp);
});




//################################# Sharing Data #################################//
// Route to get Sharable Messages
app.get("/api/getSharableMessages", async (req,res)=>{
    const resp = await sharable.getSharableMessages(req);
    res.send(resp);
});

// Route to get shortened link
app.get("/api/getShortenedLink/:url", async (req,res)=>{
    const resp = await sharable.getShortenedLink(req);
    res.send(resp);
});
    



//################################# Stripe #################################//
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (request, response) => {
    const res = processStripeWebhook(request);
    response.send();
});


//################################# User #################################//



//################################# Wallet #################################//
// Route to get OG Balance
app.get("/api/getOGBalance/:address", async (req,res)=>{
    const resp = await sdk.getOGBalance(req);
    res.send(resp);
});

// Route to get user's NFT balance
app.get("/api/getWalletNFTBalanceByTokenID/:address/:token_id/:user_id/:qty", async (req,res)=>{
    const resp = await sdk.getWalletNFTBalanceByTokenID(req);
    res.send(resp);
});

// Route to get wallet DL data
app.get("/api/getWalletDLBalance/:address", async (req,res)=>{
    const resp = await sdk.getWalletDLBalance(req);
    res.send(resp);
});



app.listen(PORT, ()=>{
    console.log('Server is running.');
});

export default app;