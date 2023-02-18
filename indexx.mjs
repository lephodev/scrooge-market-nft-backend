import express, { json } from 'express';
import React from 'react';
import { MongoClient, ServerApiVersion } from 'mongodb';
import connectToDB, {uri, client, get_scrooge_usersDB, get_affiliatesDB} from './config/mongodb.mjs';
//import { useContract, useOwnedNFTs, ThirdwebProvider, ChainId } from '@thirdweb-dev/react'
import { ThirdwebSDK } from '@thirdweb-dev/sdk/evm';
import { ObjectId } from 'mongodb';
import cors from 'cors';
//import dotenv from 'dotenv';
import sdk from './config/sdk.mjs';
import OG_ABI from './config/OG_ABI.json' assert {type: 'json'};
import JR_ABI from './config/JR_ABI.json' assert {type: 'json'};
import fetch from 'node-fetch';
import affAddOrder, {getAffiliateUser} from './config/affiliate.mjs';
import sendemail from './email/email.mjs';
// This is your test secret API key.

//const stripe = stripe('sk_test_51LpxdJDahM54GaMkWTET2glHf6XiryHiq0yThUVRt4wZKw7RsWm39Kecgp8XZGfnJHYoiKHtBzhLRWXqaKdayzd000dV81bCqB');
// Replace this endpoint secret with your endpoint's unique secret
// If you are testing with the CLI, find the secret by running 'stripe listen'
// If you are using an endpoint defined with the API or dashboard, look in your webhook settings
// at https://dashboard.stripe.com/webhooks
const endpointSecret = 'whsec_cR4a6BjWCR0H3MK5C0mAjOYd1zJh96tH';

//const envconfig = dotenv.config();
const app = express();
const PORT = 9001;
app.use(cors());
app.use(json());



/* Stripe Webhooks */
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (request, response) => {
    let event = request.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    /*if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }*/
  
    // Handle the event
    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        //console.log("--------------------Stripe Payment Processing--------------------");
        //console.log(`---------Charge for $${chargeSucceeded.amount.toLocaleString("en-US", {style:"currency", currency:"USD"})} was processed successfully through Stripe!------`);
        // Then define and call a method to handle the successful charge.
        
        /*const event_id = event.id;
        const charge_id = chargeSucceeded.id;
        const amount = chargeSucceeded.amount;
        const status = chargeSucceeded.status;
        const emailaddress = chargeSucceeded.billing_details.email;
        const name = chargeSucceeded.billing_details.name;
        const paid = chargeSucceeded.paid;
        //const pid = chargeSucceeded.metadata.pid;
        console.log(`---------event_id: ${event_id}---------`);
        console.log(`---------charge_id: ${charge_id}---------`);
        console.log(`---------amount: ${amount}---------`);
        console.log(`---------status: ${status}---------`);
        console.log(`---------emailaddress: ${emailaddress}---------`);
        console.log(`---------name: ${name}---------`);
        console.log(`---------paid: ${paid}---------`);
        console.log('chip_count: ',chargeSucceeded);
        console.log(`---------pid: ${pid}---------`);
        client.connect(async err => {
            const collection = client.db("casino-nft-marketplace").collection("items");
            const query = await collection.findOne({"token_id" : parseInt(token_id)}).then(async (item)=>{
                const chipsAdded = await addChips(user_id, parseInt(item.chip_value), address).then(()=>{
                    console.log("after send");
                    res.send(item.chip_value.toString());
                    client.close();
                });
            });
        }); 
        */

        break;
      case 'checkout.session.completed':
        const checkoutComplete = event.data.object;
        const item_id = checkoutComplete.metadata.item_id;
        const userArray = checkoutComplete.client_reference_id;
        const address = userArray.split("_")[0];
        const user_id = userArray.split("_")[1];
        const aff_id = userArray.split("_")[2];
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        if(address && item_id){
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
            client.connect(async err => {
                let isError;
                const collection = client.db("casino-nft-marketplace").collection("items");
                try{
                    const query = await collection.findOne({_id : ObjectId(item_id)}).then(async (item)=>{
                        if(!item){
                            //console.log("Item ID not found.");
                            isError = true;
                        } else {
                            //console.log("Item Purchased: ", item.name);
                            //console.log("Chip Qty: ", parseInt(item.chip_value));
                            isError = false;
                            try {
                                const chipsAdded = await addChips(user_id, parseInt(item.chip_value), address).then((trans)=>{
                                    //console.log(item.chip_value,"<------Chips sent to user.");
                                    //client.close();
                                    if(aff_id){
                                        affAddOrder(aff_id, trans.toString(), item.chip_value, item._id.toString(), user_id, address);
                                    };
                                });
                                const NFTTransferred = await transferNFT(user_id, item.token_id, address).then(async ()=>{
                                    
                                    //console.log(item.name,"------NFT transferred to user.");
                                    //client.close();
                                });
                                
                                
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    });
                } catch (error) {
                    console.log("error: ", error);
                    isError = true;
                }
                //console.log("Post Try/Catch");
                //console.log("isError: ", isError);
                if(isError){
                    console.log("Invalid data. Cannot complete process.");
                } else {
                    //console.log("#### Process Completed Successfully ####");
                }
            }); 
        } else {
            console.log("Invalid data. Cannot complete process.");
        }
        break;
    case 'payment_method.attached':
        break;
    case 'customer.created':
        break;
    case 'payment_intent.succeeded':
        break;
    case 'payment_intent.created':
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  });
/*End Stripe Webhooks*/

async function transferNFT(_user_id, _token_id, _address) {
    const PRIVATE_KEY = process.env.CASINO_NFTS_PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        throw new Error("You need to add a PRIVATE_KEY environment variable.");
    }
    // Instantiate SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.CASINO_NFTS_PRIVATE_KEY,
        "binance"
    );

    const sdk_wallet = await sdk.wallet.getAddress();
    //console.log('SDK Wallet: ',sdk_wallet);
    const contractCasinoNFT = await sdk.getContract(CasinoNFTEditionContractAddress, "edition");
    const balanceRaw = await contractCasinoNFT.balanceOf(sdk_wallet, _token_id);
    const balance = parseInt(balanceRaw);
    //console.log('Balance: ',balance);
    // Verify sdk wallet / contract has enough balance to disburse prize
    if(balance && (balance >= 1)){
        //sdk wallet has enough balance to allow prize redemption
        //console.log("Balance acceptable");
            //initiate transfer from sdk wallet to redeemer wallet
            try {
                const transferStatus = await contractCasinoNFT.transfer(_address, _token_id, 1).then((transfer)=>{
                    //console.log('Transfer Status: ', transfer.receipt.status);
                    //res.send(prize_name);
                    return true;
                });
            } catch (error) {
                console.log('Transaction Failed');
                return false;
            }
            //console.log('Transfer: ', prize_token_type);
                                
    } else {
        //sdk wallet does not have enough balance to allow prize redemption
        //console.log("Balance unacceptable");
        return('Balance Unacceptable');
    }
};

const CasinoNFTEditionContractAddress = '0x729FDb31f1Cd2633aE26F0A87EfD0CC55a336F9f';
const CasinoMarketplaceContractAddress = '0x91197754fCC899B543FebB5BE4dae193C75EF9d1';
const OGContractAddress = '0xfA1BA18067aC6884fB26e329e60273488a247FC3';
const JRContractAddress = '0x2e9F79aF51dD1bb56Bbb1627FBe4Cc90aa8985Dd';
const DLContractAddress = '0xEe7c31b42e8bC3F2e04B5e1bfde84462fe1aA768';
const BurnContractAddress = '0x000000000000000000000000000000000000dEaD';

const contractCasinoMarketplace = await sdk.getContract(CasinoMarketplaceContractAddress);
const contractOG = await sdk.getContractFromAbi(OGContractAddress, OG_ABI);
const contractJR = await sdk.getContractFromAbi(JRContractAddress, JR_ABI);

// Route to verify email exists for casino user account
app.get("/api/verifyEmail/:emailaddress", (req,res)=>{
    const emailaddress = req.params.emailaddress;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(err => {
        const collection = client.db("scrooge").collection("users");
        const query = collection.findOne({"email" : emailaddress}).then((user)=>{
          res.send(user);
          client.close();
        });
    });
});

// Route to get OG Balance
app.get("/api/getOGBalance/:address", async (req,res)=>{
    const address = req.params.address;
    const balRaw = await contractOG.erc20.balanceOf(address).then(async (rawBal)=>{
        if(rawBal.value>0){
            const bal = parseInt(rawBal.value / 10**18);
            res.send(bal.toString());
        } else {
            res.send('0');
        }
    });
});

// Route to get OG Value
app.get("/api/getOGValue/:address", async (req,res)=>{
    let current_price;
    const address = req.params.address;
    const balRaw = await contractOG.erc20.balanceOf(address).then(async (rawBal)=>{
        if(rawBal.value>0){
            const bal = parseInt(rawBal.value / 10**18);
            //console.log('Wallet OG Balance: ',bal);
            await fetch('https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0xfa1ba18067ac6884fb26e329e60273488a247fc3')
            .then(response => response.json())
            .then((data) => {
                current_price = data.market_data.current_price.usd;
                const OGValue = (current_price*bal).toFixed(0);
                res.send(OGValue);
            })
            .catch((e) => {
                console.log(e);
                res.send("0");
                return false;
            });
        } else {
            res.send("0");
        }
    });
});

// Route to get last claim date
app.get("/api/getLastClaimDate/:address", async (req,res)=>{
    const address = req.params.address;
    let isClaimable = false;
    let lastClaimDate;
    let prevmonth;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("casino-nft-marketplace").collection("holder-claim-chips-transactions");
        const qry = {};
        const sort = { "claimDate" : -1 };
        const cursor = collection.find(qry).sort(sort);
        const arr = await cursor.toArray().then((data)=>{
            const today = new Date();
            let nextmonth = new Date();
            nextmonth.setDate(nextmonth.getDate() + 30);
            if(typeof data[0]!='undefined'){
                lastClaimDate = data[0].claimDate;
                prevmonth = new Date(data[0].claimDate);
                prevmonth.setDate(prevmonth.getDate() - 30);
            }
            if(typeof lastClaimDate !='undefined'){
                res.send(lastClaimDate.toString());
            } else {
                res.send("No Previous Claim Date");
            }
        });
        client.close();
    });
});

// Route to get next claim date
app.get("/api/getNextClaimDate/:address/:type/:user_id/:token_id", async (req,res)=>{
    const address = req.params.address;
    const type = req.params.type;
    const user_id = req.params.user_id;
    const token_id = req.params.token_id;
    let collection, qry;
    let nextClaimDate;
    let lastClaimDate;
    //const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    conn(async err => {

        if(type==='holder'){
            collection = client.db("casino-nft-marketplace").collection("holder-claim-chips-transactions");
            qry = {address: address};
        } else if(type==='dl'){
            collection = client.db("casino-nft-marketplace").collection("ducky_lucks_chip_claims");
            qry = {token_id: token_id};
        } else if(type==='daily'){
            collection = client.db("casino-nft-marketplace").collection("daily_reward_token_claims");
            qry = {user_id: user_id};
        }
        const sort = { "claimDate" : -1 };
        const cursor = collection.find(qry).sort(sort);
        const arr = await cursor.toArray().then((data)=>{
            if(typeof data[0]!='undefined'){
                if (type==='daily') {
                    lastClaimDate = data[0].claimDate;
                    nextClaimDate = new Date(data[0].claimDate);
                    nextClaimDate.setDate(nextClaimDate.getDate() + 1);
                    data[0].nextClaimDate = nextClaimDate;
                    if(typeof nextClaimDate !='undefined'){
                        res.send(data[0]);
                        client.close();
                    } else {
                        res.send("CLAIM NOW");
                        client.close();
                    }
                } else {
                    lastClaimDate = data[0].claimDate;
                    nextClaimDate = new Date(data[0].claimDate);
                    nextClaimDate.setDate(nextClaimDate.getDate() + 30);
                    if(typeof nextClaimDate !='undefined'){
                        res.send(nextClaimDate.toString());
                        client.close();
                    } else {
                        res.send("CLAIM NOW");
                        client.close();
                    }
                }
            } else {
                res.send("CLAIM NOW");
                client.close();
            }
        });
    });
});

// Route to claim DL monthly Tokens
app.get("/api/claimDLTokens/:address/:user_id/:token_id", async (req,res)=>{
    const address = req.params.address;
    const user_id = req.params.user_id;
    const token_id = req.params.token_id;
    let isClaimable = false;
    let lastClaimDate;
    let prevmonth;
    let balance, balanceRaw;
    if(address && user_id){
        const PRIVATE_KEY = process.env.DL_WALLET_PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        throw new Error("You need to add a PRIVATE_KEY environment variable.");
    }
    // Instantiate SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.DL_WALLET_PRIVATE_KEY,
        "ethereum"
    );
    const contractDL = await sdk.getContract(DLContractAddress);
    if(address){
        balanceRaw = await contractDL.call("balanceOf", address);
        balance = parseInt(balanceRaw);
        //console.log('DL Balance: ',balance);
    
        if(balance>0){
            const qty = 500;
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
            client.connect(async err => {
                const collection = client.db("casino-nft-marketplace").collection("ducky_lucks_chip_claims");
                const qry = {token_id: token_id};
                const sort = { "claimDate" : -1 };
                const cursor = collection.find(qry).sort(sort);
                const arr = await cursor.toArray().then(async (data)=>{
                    const today = new Date();
                    let nextmonth = new Date();
                    nextmonth.setDate(nextmonth.getDate() + 30);
                    if(typeof data[0]!='undefined'){
                        lastClaimDate = data[0].claimDate;
                        prevmonth = new Date(data[0].claimDate);
                        prevmonth.setDate(prevmonth.getDate() - 30);
                    }
                    if(typeof lastClaimDate !='undefined'){
                        //console.log(today);
                        //console.log(nextmonth);
                        //console.log(lastClaimDate);
                        //console.log(prevmonth);
                        if(lastClaimDate <= prevmonth) {
                            //console.log("Available");
                            isClaimable = true;
                        } else {
                            //console.log("Unavailable");
                            isClaimable = false;
                        }
                    } else {
                        console.log("No Claim Date");
                        isClaimable = true;
                    }
                    
                    if(isClaimable){
                        //console.log("isClaimable is true");
                        const queryCT = await collection.insertOne({"token_id":token_id, "address":address, "user_id" : user_id, "qty":qty, "claimDate":new Date() }).then(async (trans)=>{
                            //console.log("Transaction recorded");
                            const chipsAdded = await addChips(user_id, qty, address).then(()=>{
                                res.send(qty.toString());
                                //client.close();
                            });  
                        });
                    } else {
                        //console.log("isClaimable is false");
                        res.send("ZERO! You are not allowed to claim yet.");
                        //client.close();
                    }
                });
            }); 
            //res.send(balance.toString());
        } else {
            res.send("Not Enough Balance");
        }
    }};
});

// Route to claim daily rewards
app.get("/api/claimDailyRewards/:user_id", (req,res)=>{
    const user_id = req.params.user_id;
    let isClaimable = false;
    let isConsecutive = false;
    let consecutive_days = 0;
    let lastClaimDate;
    let prevday, consecutiveDate;
    let qty = 25;
    //const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("casino-nft-marketplace").collection("daily_reward_token_claims");
        const qry = {user_id: user_id};
        const sort = { "claimDate" : -1 };
        const cursor = collection.find(qry).sort(sort);
        const arr = await cursor.toArray().then(async (data)=>{
            const today = new Date();
            let nextday = new Date();
            nextday.setDate(nextday.getDate() + 1);
            if(typeof data[0]!='undefined'){
                lastClaimDate = data[0].claimDate;
                prevday = new Date();
                prevday.setDate(prevday.getDate() - 1);
                consecutiveDate = new Date(data[0].claimDate);
                consecutiveDate.setDate(consecutiveDate.getDate() - 2);
            }
            if(typeof lastClaimDate !='undefined'){
                /*console.log('today', today);
                console.log('nextday', nextday);
                console.log('lastClaimDate', lastClaimDate);
                console.log('prevday', prevday);
                console.log('consecutiveDate', consecutiveDate);
                console.log('lastclaim time', lastClaimDate.getTime());
                console.log('prevday time', prevday.getTime());
                console.log('consecutiveDate time', consecutiveDate.getTime());*/
                //add new var for consecutiveDate that is prevday - 1, then check lastClaimDate > consecutiveDate
                if(lastClaimDate.getTime() <= prevday.getTime()) {
                    console.log("Available");
                    isClaimable = true;
                    if(lastClaimDate.getTime() >= consecutiveDate.getTime()){
                        isConsecutive = true;
                        consecutive_days = data[0].consecutive_days+1;
                        if (consecutive_days === 1){
                            qty = 25;
                        } else if (consecutive_days === 2) {
                            qty = 35;
                        } else if (consecutive_days === 3) {
                            qty = 45;
                        }  else if (consecutive_days === 4) {
                            qty = 65;
                        }  else if (consecutive_days === 5) {
                            qty = 25;
                            consecutive_days = 1;
                        }
                    }
                } else {
                    console.log("Unavailable");
                    isClaimable = false;
                }
            } else {
                console.log("No Claim Date");
                isClaimable = true;
            }
            if(isClaimable){
                //console.log("isClaimable is true");
                const queryCT = await collection.insertOne({"user_id" : user_id, "qty":qty, "claimDate":new Date(), "consecutive_days":consecutive_days }).then(async (trans)=>{
                    const chipsAdded = await addChips(user_id, qty, user_id).then(()=>{
                        //console.log("after send");
                        res.send(qty.toString());
                        //client.close();
                    });  
                });
            } else {
                //console.log("isClaimable is false");
                res.send("ZERO! You are not allowed to claim yet.");
                //client.close();
            }
        });
    });
});

// Route to get isClaimable
app.get("/api/getIsClaimable/:address", async (req,res)=>{
    const address = req.params.address;
    let isClaimable = false;
    let lastClaimDate;
    let prevmonth;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("casino-nft-marketplace").collection("holder-claim-chips-transactions");
        const qry = {};
        const sort = { "claimDate" : -1 };
        const cursor = collection.find(qry).sort(sort);
        const arr = await cursor.toArray().then((data)=>{
            const today = new Date();
            let nextmonth = new Date();
            nextmonth.setDate(nextmonth.getDate() + 30);
            if(typeof data[0]!='undefined'){
                lastClaimDate = data[0].claimDate;
                prevmonth = new Date(data[0].claimDate);
                prevmonth.setDate(prevmonth.getDate() - 30);
            }
            if(typeof lastClaimDate !='undefined'){
                console.log(today);
                console.log(nextmonth);
                console.log(lastClaimDate);
                console.log(prevmonth);
                if(lastClaimDate <= prevmonth) {
                    console.log("Available");
                    isClaimable = "true";
                } else {
                    console.log("Unavailable");
                    isClaimable = "false";
                }
            } else {
                console.log("No Claim Date");
                isClaimable = "true";
            }
            res.send(isClaimable.toString());
        }).then(()=>{
            client.close();
        });
    });
});

export async function addChips(_user_id, _qty, _address) {
    let trans_id;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    const collection = client.db("scrooge").collection("users");
    const query = await collection.findOneAndUpdate({_id : ObjectId(_user_id)},{$inc:{"wallet":_qty}}).then(async (user)=>{
        const chip_transactions_collection = client.db("casino-nft-marketplace").collection("chip_transactions");
        const queryCT = await chip_transactions_collection.insertOne({"user_id" : user.value._id, "address":_address,"chips":_qty,"timestamp":new Date() }).then((trans)=>{
            console.log("chips added", trans);
            client.close();
            trans_id = trans.insertedId;
        });
    });
    return trans_id;
};

// Route to disburse Free Tokens
app.get("/api/getFreeTokens/:address/:token_id/:user_id/:qty/:aff_id", async (req,res)=>{
    const address = req.params.address;
    const token_id = req.params.token_id;
    const user_id = req.params.user_id;
    const qty = req.params.qty;
    const aff_id = req.params.aff_id;
    
    if(address && token_id && user_id){
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
        client.connect(async err => {
            const collection = client.db("casino-nft-marketplace").collection("items");
            const query = await collection.findOne({"token_id" : parseInt(token_id)}).then(async (item)=>{
                const chipsAdded = await addChips(user_id, parseInt(item.chip_value), address).then((trans)=>{
                    console.log("trans idx: ", trans);
                    res.send(item.chip_value.toString());
                    console.log("aff id: ", aff_id);
                    if(aff_id && (aff_id != user_id)){
                        affAddOrder(aff_id, trans.toString(), item.chip_value, item._id.toString(), user_id, address);
                    };
                });
                client.close();
            });
        }); 
        
    };
});

// Route to claim holder monthly Tokens
app.get("/api/claimHolderTokens/:address/:user_id", async (req,res)=>{
    const address = req.params.address;
    const user_id = req.params.user_id;
    let isClaimable = false;
    let lastClaimDate;
    let prevmonth;
    let OGValue;
    let current_price;
    if(address && user_id){
        const balRaw = await contractOG.erc20.balanceOf(address).then(async (rawBal)=>{
            const bal = parseInt(rawBal.value / 10**18);
            console.log('Wallet OG Balance: ',bal);
            await fetch('https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0xfa1ba18067ac6884fb26e329e60273488a247fc3')
            .then(response => response.json())
            .then((data) => {
                current_price = data.market_data.current_price.usd;
                OGValue = ((current_price*bal)*.1).toFixed(0);
                return OGValue;
            })
            .catch((e) => {
                console.log(e);
                return false;
            });
        });
        console.log('Value: ',OGValue);
        if(OGValue>0){
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
            client.connect(async err => {
                const collection = client.db("casino-nft-marketplace").collection("holder-claim-chips-transactions");
                const qry = {address: address};
                const sort = { "claimDate" : -1 };
                const cursor = collection.find(qry).sort(sort);
                const arr = await cursor.toArray().then(async (data)=>{
                    const today = new Date();
                    let nextmonth = new Date();
                    nextmonth.setDate(nextmonth.getDate() + 30);
                    if(typeof data[0]!='undefined'){
                        lastClaimDate = data[0].claimDate;
                        prevmonth = new Date(data[0].claimDate);
                        prevmonth.setDate(prevmonth.getDate() - 30);
                    }
                    if(typeof lastClaimDate !='undefined'){
                        console.log(today);
                        console.log(nextmonth);
                        console.log(lastClaimDate);
                        console.log(prevmonth);
                        if(lastClaimDate <= prevmonth) {
                            console.log("Available");
                            isClaimable = true;
                        } else {
                            console.log("Unavailable");
                            isClaimable = false;
                        }
                    } else {
                        console.log("No Claim Date");
                        isClaimable = true;
                    }
                    
                    if(isClaimable){
                        console.log("isClaimable is true");
                        const queryCT = await collection.insertOne({"address":address, "user_id" : user_id, "qty":parseInt(OGValue), "claimDate":new Date() }).then(async (trans)=>{
                            console.log("Transaction recorded");
                            const chipsAdded = await addChips(user_id, parseInt(OGValue), address).then(()=>{
                                console.log("after send");
                                res.send(OGValue);
                                client.close();
                            });  
                        });
                    } else {
                        console.log("isClaimable is false");
                        res.send("ZERO! You are not allowed to claim yet.");
                        client.close();
                    }
                });
            }); 
        } else {
            console.log("ZERO Balance");
            res.send("ZERO! You do not hold enough Scrooge Coin crypto.");
        }
    } 
});

// Route to get user's NFT balance
app.get("/api/getWalletNFTBalanceByTokenID/:address/:token_id/:user_id/:qty", async (req,res)=>{
    const address = req.params.address;
    const token_id = req.params.token_id;
    const user_id = req.params.user_id;
    const qty = req.params.qty;
    if(address && token_id){
        const bal = await contractCasinoNFT.erc1155.balanceOf(address, token_id);
        console.log('Wallet NFT Balance: ',bal.toString());
        res.send(bal.toString());
    } 
});

// Route to get available prizes
app.get("/api/getPrizes", async (req,res)=>{
    //const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    //client.connect(async err => {
        //const collection = client.db("casino-nft-marketplace").collection("prizes");
        const qry = {};
        const sort = { "price" : 1 };
        const cursor = get_marketplace_prizesDB.find(qry).sort(sort);
        const arr = await cursor.toArray().then((data)=>{
            res.send(data);
            //client.close();
        });
    //});
});

// Route to get user's redeemed prizes
app.get("/api/getUserRedeemed/:user_id", (req,res)=>{
    const user_id = req.params.user_id;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("casino-nft-marketplace").collection("redeem_prize_transactions");
        const qry = {"user_id" : user_id};
        const sort = { "timestamp" : -1 };
        //const cursor = collection.find(qry).sort(sort);
        const aggCursor = await collection.aggregate([
            { $match: { user_id: user_id}},
            { $sort: { "timestamp" : -1}},
            {
            $lookup: {
             from: 'prizes',
             let: {"searchID": {$toObjectId: "$prize_id"}},
             pipeline: [
                {$match: {
              $expr: {
               $eq: [
                '$_id', '$$searchID'
               ]
              }
            }},
              {"$project":{"category": 1, "name": 1, "image_url": 1}},
              
            ],
              as: 'prize_details'
            }}
        ]);
            //for await (const doc of aggCursor) {
                //console.log(doc);
            //}

            const arr = await aggCursor.toArray().then((data)=>{
                //console.log(data);
                res.send(data);
                client.close();
            });
    });
});

/*
const collection = client.db("casino-nft-marketplace").collection("redeem_prize_transactions");
        const qry = {"user_id" : user_id};
        const sort = { "timestamp" : -1 };
        const cursor = collection.find(qry).sort(sort);
        const arr = await cursor.toArray().then((data)=>{
            console.log('array: ', data);
            res.send(data);
            client.close();
        });
*/

// Route to get user's current chip count
app.get("/api/getUserChipCount/:user_id", (req,res)=>{
    const user_id = req.params.user_id;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("scrooge").collection("users");
        const query = collection.findOne({_id : ObjectId(user_id)}).then((user)=>{
            res.send(user);
            client.close();
        });
    });
});

async function getOGCurrentPrice() {
    let curr_price;
    await fetch('https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0xfa1ba18067ac6884fb26e329e60273488a247fc3')
        .then(response => response.json())
        .then((data) => {
            curr_price = data.market_data.current_price.usd;
            return curr_price;
        })
        .catch((e) => {
            console.log(e);
            return false;
    });
    return (curr_price);
}

async function getJRCurrentPrice() {
    let curr_price;
    await fetch('https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0x2e9f79af51dd1bb56bbb1627fbe4cc90aa8985dd')
        .then(response => response.json())
        .then((data) => {
            curr_price = data.market_data.current_price.usd;
            return curr_price;
        })
        .catch((e) => {
            console.log(e);
            return false;
    });
    return (curr_price);
}

async function getMerchCouponCode(store_id, discount_type) {
    let coupon_code;
    let coupon;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    const coupons_merch_collection = client.db("casino-nft-marketplace").collection("coupons_merch");
    //console.log("discount_type: ", discount_type);
    //const searchQry = '^'+discount_type+'$';
    const query = await coupons_merch_collection.findOne({"isClaimed" : false, "store_id":"JR", "coupon_code": new RegExp('^'+discount_type+'') }).then((coup)=>{
        //coupon_code = coup.data.coupon_code;
        coupon = coup;
        //console.log("Coupon: ", coupon);
        //console.log("Coupon Code: ", coupon_code);
        client.close();
        return true;
    });
    return (coupon);
}

// Route to redeem prize
app.get("/api/redeemPrize/:address/:user_id/:prize_id", (req,res)=>{
    const user_id = req.params.user_id;
    const address = req.params.address;
    const prize_id = req.params.prize_id;
    let sdk;
    let balance;
    let balanceRaw;
    let curr_price;
    let prize_name;
    let prize_price;
    let prize_category;
    let coupon;
    let coupon_code;
    let coupon_obj_id;
    let discount_type;
    let store_id;
    let prize_token_qty;
    let prize_contract;
    let prize_contract_name;
    let user_ticket;
    let prize_token_type;
    let prize_token_id;
    let prize_redeem_action;
    let DL_token_id;
    let DL_token_obj_id;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection_prizes = client.db("casino-nft-marketplace").collection("prizes");
        const collection_DL = client.db("casino-nft-marketplace").collection("ducky_lucks_prizes");
        const collection_users = client.db("scrooge").collection("users");
        const collection_redeem_prize_transactions = client.db("casino-nft-marketplace").collection("redeem_prize_transactions");
        const collection_common_totals = client.db("common-data").collection("common_totals");
        const query = collection_prizes.findOne({_id : ObjectId(prize_id)}).then(async (prize)=>{
            
            // assign prize attributes to variables
            prize_name = prize.name; // price of selected prize in tickets
            prize_price = prize.price; // price of selected prize in tickets
            if(prize.isDynamic){
                //coupon_code = await getMerchCouponCode('JR', 'pr10off');
                //console.log("post coupon code: ", coupon_code);
                if (prize.contract === '0xfA1BA18067aC6884fB26e329e60273488a247FC3') {
                    curr_price = await getOGCurrentPrice();
                } else if (prize.contract === '0x2e9F79aF51dD1bb56Bbb1627FBe4Cc90aa8985Dd') {
                    curr_price = await getJRCurrentPrice();
                }
                prize_token_qty = (((prize_price/100)/curr_price)/2).toFixed(0);
                console.log("prize qty: ", prize_token_qty);
            } else {
                prize_token_qty = prize.token_qty; // quantity of tokens to be transferred upon redemption
            }
            prize_category = prize.category; // category of prize
            if (prize_category === 'Merch') {
                store_id = prize.store_id;
                discount_type = prize.discount_type;
                coupon = await getMerchCouponCode(store_id, discount_type);
                coupon_obj_id = coupon._id;
                coupon_code = coupon.coupon_code;
                //console.log("post coupon code: ", coupon_code);
                
            }
            prize_contract = prize.contract; // contract address of prize
            prize_contract_name = prize.contract_name; // shorthand name for contract of prize
            prize_token_type = prize.token_type; // token type (erc20/erc721/erc1155) of prize
            prize_token_id = prize.token_id; // token_id of prize (null if erc20)
            prize_redeem_action = prize.redeem_action; // action to execute redemption of prize
            if(prize_name==="Ducky Lucks NFT"){
                const queryDL = await collection_DL.findOne({claimed : false});
                DL_token_id = queryDL.token_id;
                DL_token_obj_id = queryDL._id;
                console.log("DL: ",DL_token_id);
            }
        }).then(()=>{
            // get user record from users table by _id
            const query2 = collection_users.findOne({_id : ObjectId(user_id)}).then((user)=>{
                console.log("User's Tickets: ", user.ticket);
                user_ticket = user.ticket; //user's available ticket balance

                // verify user has more (or equal) tickets than price of prize
                if(user_ticket >= prize_price){
                    console.log("User has enough tickets.");
                    
                    const query3 = collection_users.findOneAndUpdate({_id : ObjectId(user_id)},{$inc:{"ticket":-prize_price}}).then(async (user)=>{
                        console.log("User's tickets decremented by: ",prize_price);
                        client.close();

                        // Check for contract name to connect to from prize record
                        if (prize_contract_name === 'OG') {
                            // Verify private key exists
                            const PRIVATE_KEY = process.env.OG_PRIVATE_KEY;
                            if (!PRIVATE_KEY) {
                                throw new Error("You need to add a PRIVATE_KEY environment variable.");
                            }

                            // Instantiate SDK
                            sdk = ThirdwebSDK.fromPrivateKey(
                                process.env.OG_PRIVATE_KEY,
                                "binance"
                            );

                        } else if (prize_contract_name === 'JR') {
                            // Verify private key exists
                            const PRIVATE_KEY = process.env.JR_PRIVATE_KEY;
                            if (!PRIVATE_KEY) {
                                throw new Error("You need to add a PRIVATE_KEY environment variable.");
                            }

                            // Instantiate SDK
                            sdk = ThirdwebSDK.fromPrivateKey(
                                process.env.JR_PRIVATE_KEY,
                                "binance"
                            );

                        } else if (prize_contract_name === 'Casino NFTS') {
                            // Verify private key exists
                            const PRIVATE_KEY = process.env.CASINO_NFTS_PRIVATE_KEY;
                            if (!PRIVATE_KEY) {
                                throw new Error("You need to add a PRIVATE_KEY environment variable.");
                            }
                            // Instantiate SDK
                            sdk = ThirdwebSDK.fromPrivateKey(
                                process.env.CASINO_NFTS_PRIVATE_KEY,
                                "binance"
                            );

                        } else if (prize_contract_name === 'DL') {
                            // Verify private key exists
                            const PRIVATE_KEY = process.env.DL_WALLET_PRIVATE_KEY;
                            if (!PRIVATE_KEY) {
                                throw new Error("You need to add a PRIVATE_KEY environment variable.");
                            }
                            // Instantiate SDK
                            sdk = ThirdwebSDK.fromPrivateKey(
                                process.env.DL_WALLET_PRIVATE_KEY,
                                "ethereum"
                            );

                        } else if (prize_category==='Merch') {
                        
                        } else {
                            // prize_contract_name does not match any known contract names
                            console.log("Unknown prize contract name.");
                            res.send('Invalid Prize Data');
                        }

                        if (prize_token_type === 'erc20') {
                            balanceRaw = await sdk.wallet.balance(prize_contract);
                            balance = parseInt(balanceRaw.displayValue);
                            console.log('Balance: ',balance);
                            // Verify sdk wallet / contract has enough balance to disburse prize
                            if(balance && (balance >= prize_token_qty)){
                                //sdk wallet has enough balance to allow prize redemption
                                console.log("Balance acceptable");

                                //check for redeem_action from prize record
                                if (prize_redeem_action === 'transfer') {
                                    //initiate transfer from sdk wallet to redeemer wallet
                                    try {
                                        //const transfer = await sdk.wallet.transfer(address, prize_token_qty, prize_contract);
                                        //console.log('Status: ', transfer.receipt.status);
                                        res.send(prize_name);
                                        postPrizeRedemption(prize_id, user_id);
                                    } catch (error) {
                                        console.log('Transaction Failed');
                                        res.send('Transaction Failed');
                                    }
                                    console.log('Transfer: ', prize_token_type);
                                    
                                } else if (prize_redeem_action === 'burn') {
                                    //initiate burn from sdk wallet
                                    try {
                                        //const burn = await sdk.wallet.transfer(BurnContractAddress, prize_token_qty, prize_contract);
                                        //console.log('Status: ', transfer.receipt.status);
                                        res.send(prize_name);
                                        postPrizeRedemption(prize_id, user_id);
                                    } catch (error) {
                                        console.log('Transaction Failed');
                                        res.send('Transaction Failed');
                                    }
                                    console.log('Burn: ', prize_token_type);

                                } else {
                                    // prize_redeem_action does not match any known redeem actions
                                    console.log("Unknown prize redeem action.");
                                    res.send('Invalid Prize Data');
                                }
                                                        
                            } else {
                                //sdk wallet does not have enough balance to allow prize redemption
                                console.log("Balance unacceptable");
                                res.send('Balance Unacceptable');
                            }

                        } else if (prize_token_type === 'erc1155') {
                            //start erc1155 process
                            const sdk_wallet = await sdk.wallet.getAddress();
                            console.log('SDK Wallet: ',sdk_wallet);
                            const contractCasinoNFT = await sdk.getContract(CasinoNFTEditionContractAddress, "edition");
                            balanceRaw = await contractCasinoNFT.balanceOf(sdk_wallet, prize_token_id);
                            balance = parseInt(balanceRaw);
                            console.log('Balance: ',balance);
                            // Verify sdk wallet / contract has enough balance to disburse prize
                            if(balance && (balance >= prize_token_qty)){
                                //sdk wallet has enough balance to allow prize redemption
                                console.log("Balance acceptable");

                                //check for redeem_action from prize record
                                if (prize_redeem_action === 'transfer') {
                                    //initiate transfer from sdk wallet to redeemer wallet
                                    try {
                                        const transfer = await contractCasinoNFT.transfer(address, prize_token_id, prize_token_qty);
                                        console.log('Status: ', transfer.receipt.status);
                                        res.send(prize_name);
                                        postPrizeRedemption(prize_id, user_id);
                                    } catch (error) {
                                        console.log('Transaction Failed');
                                        res.send('Transaction Failed');
                                    }
                                    console.log('Transfer: ', prize_token_type);
                                    
                                } else if (prize_redeem_action === 'burn') {
                                    //initiate burn from sdk contract
                                    try {
                                        //const burn = await sdk.wallet.transfer(BurnContractAddress, prize_token_qty, prize_contract);
                                        //const burn = await contractCasinoNFT.burnTokens(prize_token_id, prize_token_qty);
                                        //console.log('Status: ', transfer.receipt.status);
                                        res.send(prize_name);
                                        postPrizeRedemption(prize_id, user_id);
                                    } catch (error) {
                                        console.log('Transaction Failed');
                                        res.send('Transaction Failed');
                                    }
                                    console.log('Burn: ', prize_token_type);
                                    
                                } else {
                                    // prize_redeem_action does not match any known redeem actions
                                    console.log("Unknown prize redeem action.");
                                    res.send('Invalid Prize Data');
                                }
                                                        
                            } else {
                                //sdk wallet does not have enough balance to allow prize redemption
                                console.log("Balance unacceptable");
                                res.send('Balance Unacceptable');
                            }

                        } else if (prize_token_type === 'merch') {
                            console.log("Sending coupon code...");
                            console.log("Code sending: ", coupon_code);
                            res.send(prize_name);
                            const markRedeemed = false;
                            postPrizeRedemption(prize_id, user_id, coupon_code, markRedeemed);
                            updateMerchClaimFlag(coupon_obj_id, user_id);
                        } else if (prize_token_type === 'erc721') {
                            //start erc721 process
                            //if there are no unclaimed NFTs in DL table, do not execute functions
                            if (!DL_token_id){
                                console.log("No DL NFTs available.");
                                res.send('Prize Currently Unavailable');
                            } else {
                                const sdk_wallet = await sdk.wallet.getAddress();
                                console.log('SDK Wallet: ',sdk_wallet);
                                const contractDL = await sdk.getContract(DLContractAddress);
                                balanceRaw = await contractDL.call("balanceOf", sdk_wallet);
                                balance = parseInt(balanceRaw);
                                console.log('Balance: ',balance);
                                // Verify sdk wallet / contract has enough balance to disburse prize
                                if(balance && (balance >= prize_token_qty)){
                                    //sdk wallet has enough balance to allow prize redemption
                                    console.log("Balance acceptable");
    
                                    //check for redeem_action from prize record
                                    if (prize_redeem_action === 'transfer') {
                                        //initiate transfer from sdk wallet to redeemer wallet
                                        try {
                                            //const transfer = await contractDL.call("safeTransferFrom", sdk_wallet, address, DL_token_id);
                                            //console.log('Status: ', transfer.receipt.status);
                                            res.send(prize_name);
                                            //update claim flag to true in ducky_lucks_prizes table
                                            updateDLClaimFlag(DL_token_obj_id);
                                            postPrizeRedemption(prize_id, user_id);
                                        } catch (error) {
                                            console.log('Transaction Failed');
                                            console.log(error);
                                            res.send('Transaction Failed');
                                        }
                                        console.log('Transfer: ', prize_token_type);
                                        
                                    } else if (prize_redeem_action === 'burn') {
                                        //initiate burn from sdk contract
                                        try {
                                            //const burn = await contractDL.call("burn", prize_token_id);
                                            //console.log('Status: ', transfer.receipt.status);
                                            res.send(prize_name);
                                            postPrizeRedemption(prize_id, user_id);
                                        } catch (error) {
                                            console.log('Transaction Failed');
                                            res.send('Transaction Failed');
                                        }
                                        console.log('Burn: ', prize_token_type);
                                        
                                    } else {
                                        // prize_redeem_action does not match any known redeem actions
                                        console.log("Unknown prize redeem action.");
                                        res.send('Invalid Prize Data');
                                    }
                                                            
                                } else {
                                    //sdk wallet does not have enough balance to allow prize redemption
                                    console.log("Balance unacceptable");
                                    res.send('Balance Unacceptable');
                                }
                            }
                            
                        } else {
                            console.log("Prize token type not recognized.")
                            res.send('Invalid Prize Data');
                        }
                        
                    });
                } else {
                    console.log("User does not have enough tickets.");
                    res.send("Not Enough Tickets");
                    //client.close();
                }
            });
        });
    });
});

async function postPrizeRedemption(prize_id, user_id, coupon_code=null, markRedeemed=null) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        try {
            const collection = client.db("casino-nft-marketplace").collection("redeem_prize_transactions");
            const queryCT = await collection.insertOne({"user_id" : user_id, "prize_id":prize_id, "timestamp":new Date(), "coupon_code": coupon_code, "markRedeemed":markRedeemed }).then((trans)=>{
                console.log("Prize redemption recorded");
                client.close();
                return true;
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    });
}

async function updateDLClaimFlag(DL_token_obj_id) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        try {
            const collection = client.db("casino-nft-marketplace").collection("ducky_lucks_prizes");
            const query = await collection.findOneAndUpdate({_id : ObjectId(DL_token_obj_id)},{$set:{"claimed":true}}).then(async (data)=>{
                //res.send(data);
                console.log("DL Claim Updated");
                client.close();
                return true;
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    });
}


async function updateMerchClaimFlag(coupon_obj_id, user_id) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        try {
            const collection = client.db("casino-nft-marketplace").collection("coupons_merch");
            const query = await collection.findOneAndUpdate({_id : ObjectId(coupon_obj_id)},{$set:{"isClaimed":true, "user_id":user_id, "claim_time":new Date()}}).then(async (data)=>{
                console.log("Merch Coupon Claim Updated");
                client.close();
                return true;
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    });
}

// Route to update markRedeemed flag in prize_redeem_transactions table
app.get("/api/markMerchCouponRedeemed/:trans_id/:user_id", async (req,res)=>{
    const trans_id = req.params.trans_id;
    const user_id = req.params.user_id;
    const updatedFlag = await updateMerchRedeemedFlag(trans_id, user_id);
    res.send('Code Marked as Redeemed');
});

async function updateMerchRedeemedFlag(trans_id, user_id) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        try {
            const collection = client.db("casino-nft-marketplace").collection("redeem_prize_transactions");
            const query = await collection.findOneAndUpdate({_id : ObjectId(trans_id)},{$set:{"markRedeemed":true, "user_id":user_id}}).then(async (data)=>{
                console.log("Merch Coupon Marked Redeemed");
                client.close();
                return true;
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    });
}

//Sharable Data
// Route to get Sharable Messages
app.get("/api/getSharableMessages", async (req,res)=>{
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("sharing-data").collection("messages");
        const qry = { "category" : "casino_aff"};
        //const sort = { "claimDate" : -1 };
        const cursor = collection.find(qry);
        const arr = await cursor.toArray().then((data)=>{
            if(typeof data[0]!='undefined'){
                res.send(data);
            } else {
                res.send(false);
            }
        });
        client.close();
    });
});

// Route to get Affiliate user
app.get("/api/getAffiliateUser/:user_id", async (req,res)=>{
    const user_id = req.params.user_id;
    /*const affUser = await getAffiliateUser(user_id).then((aff)=>{
        //console.log("in getAffUser: ", aff);
        //res.send(aff);
    });*/
    
    //const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("affiliates").collection("affiliates");
        const query = collection.findOne({user_id : user_id}).then(async (user)=>{
            if(user){
                res.send(user);
                //console.log('User: ',user);
                //client.close();
            } else {
                res.send("User not found.");
                //client.close();
            }
        });
    });
});

// Route to create Affiliate user
app.get("/api/createAffiliateUser/:user_id/:ip_address", async (req,res)=>{
    const user_id = req.params.user_id;
    const ip_address = req.params.ip_address;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("affiliates").collection("affiliates");
        const query = collection.findOne({user_id : user_id}).then(async (user)=>{
            if(user){
                res.send("You are already registered as an affiliate.");
                client.close();
            } else {
                const queryCT = await collection.insertOne({"user_id" : user_id, "is_vendor":false, "ip_address":ip_address, "created_at":new Date() }).then((aff)=>{
                    console.log("aff added: ", aff);
                    client.close();
                    res.send(aff.insertedId);
                });
            }
        });
    });
});

// Route to get wallet DL data
app.get("/api/getWalletDLBalance/:address", async (req,res)=>{
    let balanceRaw, balance;
    const address = req.params.address;
    //console.log('address: ', address);
    const PRIVATE_KEY = process.env.DL_WALLET_PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        throw new Error("You need to add a PRIVATE_KEY environment variable.");
    }
    // Instantiate SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.DL_WALLET_PRIVATE_KEY,
        "ethereum"
    );
    const contractDL = await sdk.getContract(DLContractAddress);
    if(address){
        balanceRaw = await contractDL.call("balanceOf", address);
        balance = parseInt(balanceRaw);
        //console.log('DL Balance: ',balance);
    
        if(balance>0){
            res.send(balance.toString());
        } else {
            res.send("Not Enough Balance");
        }
    }
});


/*const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    client.connect(async err => {
        const collection = client.db("affiliates").collection("affiliates");
        const query = collection.findOne({user_id : user_id}).then(async (user)=>{
            if(user){
                res.send("You are already registered as an affiliate.");
                client.close();
            } else {
                const queryCT = await collection.insertOne({"user_id" : user_id, "is_vendor":false, "ip_address":ip_address, "created_at":new Date() }).then((aff)=>{
                    //console.log("aff added: ", aff);
                    client.close();
                    res.send(aff.insertedId);
                });
            }
        });
    });*/

// Route to trigger email
app.get("/api/sendEmail/:to/:subject/:body", async (req,res)=>{
    const _to = req.params.to;
    const subject = req.params.subject;
    const body = req.params.body;
    
    if(_to && subject && body){
        const emailSend = await sendemail(_to, subject, body).then((send)=>{
            console.log("send idx: ", send);
            res.send(send.toString());
        });
    };
});

app.listen(PORT, ()=>{
    console.log('Server is running.');
});

export default app;