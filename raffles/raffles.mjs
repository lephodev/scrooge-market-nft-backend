import { ObjectId } from 'mongodb';
import { addChips } from '../config/rewards.mjs';
import * as db from '../config/mongodb.mjs';
import * as useSDK from '../config/sdk.mjs';
import moment from 'moment/moment.js';
import Web3 from 'web3';
import OG_ABI from "../config/OG_ABI.json" assert { type: "json" };
// import JR_ABI from "./JR_ABI.json" assert { type: "json" };

/// get all current raffles
export async function getCurrentRaffles(req) {
    console.log("rafflesss");
    let resp;
    const limit = req.params.limit;
    const days = req.params.days;
    const qry = {"end_date": {
                        $gt: moment(new Date()).toDate()
                    },
                "start_date": {
                    $lt: moment(new Date()).toDate()
                }};
    const sort = { "end_date" : 1 };
    const cursor = db.get_rafflesDB().find();
    // console.log("cursor",cursor);
    const arr = await cursor.toArray();
    let newArr = [];
    await asyncArrayMap(arr, async (prize, index) => {
      return new Promise(async (getPrize) => {
        getPrize(
            arr[index].prize_details = await getPrizeByPrizeIDInt(prize.prize_id)
        );
      });
    }).then(async (mappedArray) => {
        await asyncArrayMap(arr, async (raffle, index) => {
            //console.log('raffle_id: ', raffle._id);
            return new Promise(async (getCount) => {
                getCount(
                  arr[index].entries_count = await (getEntriesCountByRaffleIDInt(raffle._id.toString()))
              );
            });
          }).then((mappedArray) => {
            resp = arr;
            //console.log('resp: ', resp);
          });
      //resp = arr;
    });
    async function asyncArrayMap(array, asyncMapFn) {
        const promises = array.map(asyncMapFn);
        const result = await Promise.all(promises);
        return result;
      }
    return resp;
};

/// get prize by prize_id
export async function getPrizeByPrizeID(req) {
    let resp;
    const prize_id = req.params.prize_id;
    const qry = {_id: ObjectId(prize_id)};
    const cursor = await db.get_marketplace_prizesDB().findOne(qry).then((prize)=>{
        if(prize){
            resp = prize;
        } else {
            resp = "No Prize Found";
        }
    });
    return resp;
};

/// get prize by prize_id
export async function getPrizeByPrizeIDInt(prize_id) {
    let resp;
    const qry = {_id: ObjectId(prize_id)};
    const cursor = await db.get_marketplace_prizesDB().findOne(qry).then((prize)=>{
        if(prize){
            resp = prize;
        } else {
            resp = "No Prize Found";
        }
    });
    return resp;
};

/// get all finished raffles
export async function getFinishedRaffles(req) {
    let resp;
    const limit = req.params.limit;
    const days = req.params.days;
    const qry = {"end_date": {
                        $lt: moment(new Date()).toDate()
                    }};
    const sort = { "end_date" : -1 };
    const cursor = db.get_rafflesDB().find(qry).sort(sort);
    const arr = await cursor.toArray();
    let newArr = [];
    await asyncArrayMap(arr, async (prize, index) => {
      return new Promise(async (getPrize) => {
        getPrize(
            arr[index].prize_details = await getPrizeByPrizeIDInt(prize.prize_id)
        );
      });
    }).then((mappedArray) => {
      resp = arr;
    });
    async function asyncArrayMap(array, asyncMapFn) {
        const promises = array.map(asyncMapFn);
        const result = await Promise.all(promises);
        return result;
      }
    return resp;
};

/// get all entries by raffle_id
export async function getEntriesByRaffleID(req) {
    let resp;
    const limit = req.params.limit;
    const days = req.params.days;
    const raffle_id = req.params.raffle_id;
    const qry = {"raffle_id": raffle_id};
    const sort = { "entry_date" : -1 };
    const cursor = db.get_raffles_entriesDB().find(qry).sort(sort);
    const arr = await cursor.toArray().then((data)=>{
        if(typeof data[0]!='undefined'){
            //console.log('raffles_entries: ', data);
            
        } else {
            resp = "No Current Raffles";
        }
    });
    return resp;
};

export async function getEntriesByRaffleIDInt(raffle_id) {
    let resp;
    const qry = {"raffle_id": raffle_id};
    const sort = { "entry_date" : -1 };
    const cursor = db.get_raffles_entriesDB().find(qry).sort(sort);
    const arr = await cursor.toArray().then((data)=>{
        if(typeof data[0]!='undefined'){
            //console.log('raffles_entries: ', data);
            resp = data;
        } else {
            resp = "No Current Raffles";
        }
    });
    //console.log('count: ', resp.length);
    return resp;
};

/// get all entries by raffle_id
export async function getEntriesCountByRaffleID(req) {
    let resp;
    const raffle_id = req.params.raffle_id;
    const qry = {"raffle_id": raffle_id};
    const cursor = db.get_raffles_entriesDB().find(qry);
    const arr = await cursor.toArray().then((data)=>{
        resp = (data.length).toString();
    });
    //console.log('resp: ', resp);
    return resp;
};

export async function getEntriesCountByRaffleIDInt(raffle_id) {
    let resp;
    const qry = {"raffle_id": raffle_id};
    const cursor = db.get_raffles_entriesDB().find(qry);
    const arr = await cursor.toArray().then((data)=>{
        resp = (data.length).toString();
    });
    //console.log('count resp: ', resp);
    return resp;
};

/// get entries by user ID
export async function getEntriesByUserID(req) {
    let resp;
    const limit = req.params.limit;
    const days = req.params.days;
    const user_id = req.params.user_id;
    const qry = {"user_id": user_id};
    const sort = { "entry_date" : -1 };
    const cursor = db.get_raffles_entriesDB().find(qry).sort(sort);
    const arr = await cursor.toArray().then((data)=>{
        if(typeof data[0]!='undefined'){
            //console.log('raffles_entries_user: ', data);
            resp = data;
        } else {
            resp = "No Entries Found For User";
        }
    });
    return resp;
};

/// get draw by raffle_id
export async function getDrawByRaffleID(req) {
    let resp;
    const raffle_id = req.params.raffle_id;
    const qry = {"raffle_id": raffle_id};
    const cursor = db.get_raffles_drawsDB().findOne(qry);
    const arr = await cursor.toArray().then((data)=>{
        if(typeof data[0]!='undefined'){
            //console.log('raffles_draws: ', data);
            resp = data;
        } else {
            resp = "No Draw Found";
        }
    });
    return resp;
};

export async function enterRaffle(req) {
    console.log("-----------------------------------------------");
    let resp;
    const raffle_id = req.params.raffle_id;
    const user_id = req.params.user_id;
    const address = req.params.address;
    const qry = {"user_id": user_id};
    const cursor = await db.get_raffles_usersDB().findOne(qry);
    const qry2 = {_id: ObjectId(raffle_id)};
    const cursor2 = await db.get_rafflesDB().findOne(qry2);
    if(cursor && cursor2){
        if(cursor.tickets >= cursor2.entry_fee){
            try {
                const query2 = await db.get_raffles_usersDB().findOneAndUpdate({"user_id": user_id},{$inc:{"tickets":-(cursor2.entry_fee)}}).then(async (user)=>{
                    if(user){
                        const query = await db.get_raffles_entriesDB().insertOne({"raffle_id" : raffle_id, "user_id" : user_id, "address":address,"entry_date":new Date()}).then(async (entryTrans)=>{
                            resp = entryTrans.insertedId.toString();
                        });
                    }
                });
            } catch (error) {
                console.log('Transaction Failed');
                resp = "Error";
            }
        }
    } else {
        //console.log('else');
    }
    return resp;
};

export async function getUserRaffleTickets(req) {
    let resp;
    const user_id = req.params.user_id;
    const qry = {"user_id": user_id};
    const cursor = await db.get_raffles_usersDB().findOne(qry);
    if(cursor){
        resp = await cursor;
    } else {
        //console.log('else');
    }
    return resp;
};

export async function checkPurchaseEvent() {
    // The name of the event to get logs for
    const eventName = "Transfer";

    // Optionally pass in options to limit the blocks from which events are retrieved
    const options = {
    fromBlock: 0,
    toBlock: "latest", // can also pass "latest"
    order: "desc",
    // Configure event filters (filter on indexed event parameters)
    filters: {
        from: "0x77eA7d7428178f676a16E620E705e8fAF63402B6",
        to: "0x29efb15bdcd0a6ce5bcf0b7811f227080fba0427",
    },
    };

    const events = await contract.events.getEvents(eventName, options);
    //console.log("purch", events[0].eventName);
    //console.log("purch2", events[0].data);
}

async function getItemByID(id){
    const getTickets = await db.get_marketplace_itemsDB().findOne({ _id: ObjectId(result.item_id) }).then(async (item) => {
        if(item){
            return item;
        }
    });
}

export async function initEntryPurchase(req) {
    const user_id = req.params.user_id;
    const address = req.params.address;
    const amt = req.params.amt;
    const item_id = req.params.item_id;
    let resp;
    var myobj = { "user_id": user_id, "address": address, "item_id": item_id, "amt": amt, "init_at": new Date() };
    const query = await db.get_raffles_purchasesDB().insertOne(myobj).then(async (entryTrans)=>{
        resp = entryTrans.insertedId.toString();
    });
    return resp;
}

export async function finalizeEntryPurchase(req) {
    const user_id = req.params.user_id;
    const address = req.params.address;
    const amt = req.params.amt;
    const purchase_id = req.params.purchase_id;
    const trans_hash = req.params.trans_hash;
    let tickets, resp;
    var query = { _id: ObjectId(purchase_id), user_id: user_id, address: address, amt: amt, finalized_at: null, trans_hash: null };
    try {
        const querya = await db.get_raffles_purchasesDB().findOne(query).then(async (result) => {
            if (result) {
                //add this back in when we have a better binance node
                //new Date(new Date().getTime() - 400 * 1000) <-- used to check if the transaction is 4 minutes old
                //const checkTrans = await getTransactionAmount(trans_hash);
                //console.log("checkTrans", checkTrans);
                const checkTrans = 1;
                if (checkTrans > 0) {
                    const getTickets = await db.get_marketplace_itemsDB().findOne({ _id: ObjectId(result.item_id) }).then(async (item) => {
                        if(item){
                            tickets= item.chip_value;
                            var query = { "user_id": user_id, "address": address, "amt": amt, "item_id": result.item_id };
                            var newvalues = { $set: { "trans_hash": trans_hash, "finalized_at": new Date() } };
                            const query2 = await db.get_raffles_purchasesDB().findOneAndUpdate(query, newvalues).then(async (purchase)=>{
                                if(purchase){
                                    const query = await db.get_raffles_usersDB().findOneAndUpdate({"user_id" : user_id}, { $inc: { "tickets": tickets } }).then(async (entryTrans)=>{
                                        if(entryTrans){
                                            try {
                                                const transfer = await transferNFT(user_id, address, result.item_id).then((trans)=>{
                                                    if(trans === "Success"){
                                                        resp = tickets.toString();
                                                        //console.log("NFT transferred");
                                                    } else {
                                                        console.log("error transferring NFT");
                                                    }
                                                });
                                            } catch (error) {
                                                console.log('Transaction Failed');
                                                resp = "Error transfering NFT.";
                                            }
                                        } else {
                                            resp="Error updating user tickets.";
                                        }
                                    });
                                } else {
                                    resp="Error updating purchase record.";
                                }
                            });
                        } else {
                            resp = "Item Not Found.";
                        }
                    });
                }
            } else {
            console.log("record not found");
            resp = "Purchase error. Please try again.";
            }
        });
    } catch (error) {
        console.log('Transaction Failed');
        resp = "Error";
    }
    return resp;
}

////////function to transfer NFT to user
// async function transferNFT(user_id, address, item_id) {
//     let resp, balance, balanceRaw;
//     const item = await db.get_marketplace_itemsDB().findOne({ _id: ObjectId(item_id) });
//     //start erc1155 process
//     const sdk_wallet = useSDK.sdk_casino_nfts_wallet;
//     const contractCasinoNFT = useSDK.contractCasinoNFT;
//     balanceRaw = await contractCasinoNFT.balanceOf(sdk_wallet, item.token_id);
//     balance = parseInt(balanceRaw);
//     // Verify sdk wallet / contract has enough balance to disburse prize
//     if(balance > 0){
//         try {
//             const transfer = await contractCasinoNFT.transfer(address, item.token_id, 1);
//             resp = "Success";
//         } catch (error) {
//             resp = 'Transaction Failed.';
//         }
//     } else {
//         console.log("Not enough balance");
//         resp = "Not enough balance.";
//     }
//     return resp;
// }

async function checkTransactionHash(transactionHash) {
    
    var web3 = new Web3(Web3.givenProvider);
    var contract = new web3.eth.Contract(OG_ABI, '0xfA1BA18067aC6884fB26e329e60273488a247FC3');
    async function getAmount(transactionHash) {
    var amount = await contract.methods.getAmount(transactionHash).call();
    contract.methods
    return amount;
    }
    var amount = await getAmount(transactionHash);
    return amount;
}

/*async function getTransactionAmount(transactionHash) {
    const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed3.binance.org/'));
    const contract = new web3.eth.Contract(OG_ABI, '0xfA1BA18067aC6884fB26e329e60273488a247FC3');
    const tx = await web3.eth.getTransaction(transactionHash);
    console.log('tx: ', tx);
    try {
        const transferEvent = await contract.getPastEvents('Transfer', { fromBlock: tx.blockNumber, toBlock: tx.blockNumber, filter: { transactionHash: transactionHash } });
        //const transferArgs = transferEvent[0].returnValues;
    } catch (error) {
        console.log('error: ', error);
    }
    //console.log('transferEvent: ', transferEvent);
    const amountInWei = transferArgs.value;
    const amountInEther = web3.utils.fromWei(amountInWei, "ether");
    console.log('web3: ', amountInEther);
    return amountInEther;
  }*/

/*async function getTransactionAmount(transactionHash) {
    const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed3.binance.org/'));
    const contract = new web3.eth.Contract(OG_ABI, '0xfA1BA18067aC6884fB26e329e60273488a247FC3');
    const tx = await web3.eth.getTransaction(transactionHash);
    console.log('tx: ', tx);
    const amountInWei = tx.value;
    const amountInEther = web3.utils.fromWei(amountInWei, "ether");
    console.log('web3: ', amountInEther);
    return amountInEther;
  }*/