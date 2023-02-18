import { ObjectId } from 'mongodb';
import * as db from './mongodb.mjs';
import * as commons from './commons.mjs';
import * as useSDK from './sdk.mjs';
import { addChips } from './rewards.mjs';
import axios from 'axios';
import * as email from '../email/email.mjs';
import moment from 'moment/moment.js';

let base_url = 'https://market.scrooge.casino';
const order_commission_pct = 10;

/// Add Order to affiliate system
export async function affAddOrder(aff_id, order_id, order_total, product_id, user_id, address) {
  //write transaction to successful_actions table
  let resp;
  let trans_id;
  const commission = (order_total/order_commission_pct).toFixed(0);
  const query = await db.get_affiliatesDB().findOne({"user_id" : aff_id}).then(async (user)=>{
      if(user){
        const queryCT = await db.get_affiliates_successful_actionsDB().insertOne({"type":"order", "user_id" : aff_id, "url":base_url, "data" : {"order_id":order_id, "product_id":product_id, "order_value":order_total, "referred_user_address":address},  "commission":commission, "referred_user_id":user_id, "timestamp":new Date(), "affiliate_id":user._id.toString() }).then(async (aff)=>{
          trans_id = aff.insertedId;
          const query = await db.get_affiliatesDB().findOneAndUpdate({"user_id" : user_id},{$inc:{"total_earned":parseInt(commission)}, $set:{"last_earned_at":new Date()}}).then(async (affUser)=>{
            if(affUser){
              const queryCT2 = await db.get_marketplace_chip_transactionsDB().insertOne({"user_id" : user_id, "address":null,"chips":parseInt(commission),"timestamp":new Date(), "aff_data":{"type":"aff commission", "successful_action_id": trans_id.toString()}}).then(async (chipTrans)=>{
                  //add chips to aff's casino wallet
                  const query3 = await db.get_scrooge_usersDB().findOneAndUpdate({_id : ObjectId(user_id)},{$inc:{"wallet":parseInt(commission)}}).then(async (affChips)=>{
                    resp = trans_id;
                  });
              });
            } else {
              resp = false;
            }
          });
        });
      } else {
        resp = false;
      }
  });
  return resp;
};

/// get affiliate leaders by Tokens
export async function getAffLeadersByTokens(req) {
  let resp;
  let limit;
  let days;
  if(req.params.limit>0){
    limit = parseInt(req.params.limit);
  } else {
    limit = 1000;
  }
  if(req.params.days>0){
    days = parseInt(req.params.days);
  } else {
    days = 5000;
  }
  let daterange = new Date();
  daterange.setDate(daterange.getDate() - days);
  const cursor = db.get_affiliates_successful_actionsDB().aggregate([
    {$match: {
      
      "timestamp": {
        "$gte": moment(daterange).toDate()
    }
      
  }},
    {
      $group: {
        _id: "$user_id",
        totalCommission: { $sum: "$commission" }
      }
    }
  ]).sort({totalCommission: -1}).limit(limit);
  
  const arr = await cursor.toArray().then((data)=>{
    //console.log('cursor: ', data);
      if(typeof data[0]!='undefined'){
        resp = data;
      } else {
        resp = ("No Entries Found For User");
      }
  });
  return resp;
};

/// get affiliate leaders by Type
export async function getAffLeadersByType(req) {
  let resp;
  const type = req.params.type;
  let limit;
  let days;
  if(type){
    if(req.params.limit>0){
      limit = parseInt(req.params.limit);
    } else {
      limit = 1000;
    }
    if(req.params.days>0){
      days = parseInt(req.params.days);
    } else {
      days = 5000;
    }
    let daterange = new Date();
    daterange.setDate(daterange.getDate() - days);
    const cursor = db.get_affiliates_successful_actionsDB().aggregate([
      {$match: {
        
        "timestamp": {
          "$gte": moment(daterange).toDate()
      },
        "type": type
        
    }},
      {
        $group: {
          _id: "$user_id",
          totalCommission: { $sum: "$commission" }
        }
      }
    ]).sort({totalCommission: -1}).limit(limit);
    
    const arr = await cursor.toArray().then((data)=>{
        if(typeof data[0]!='undefined'){
          resp = data;
        } else {
          resp = ("No Entries Found For User");
        }
    });
  }
  
  return resp;
};




export async function getAffiliateUser(req) {
  let resp;
  const user_id = req.params.user_id;
  try {
    const query = await db.get_affiliatesDB().findOne({user_id : user_id}).then(async (aff)=>{
        if(aff){
          resp = aff;
        } else {
          resp = "User not found.";
        }
    });
  } catch (error) {
    resp = "Error";
  }
  return resp;
}

// Route to create Affiliate user
export async function createAffiliateUser(req) {
  let resp;
  const user_id = req.params.user_id;
  const ip_address = req.params.ip_address;
  const query = await db.get_affiliatesDB().findOne({user_id : user_id}).then(async (user)=>{
    if(user){
      resp = "You are already registered as an affiliate.";
    } else {
      const user = await commons.getUserByUserID(user_id);
      if(!user) {
        resp = "User ID Not Found.";
      } else {
        const affShortLink = await createAffShortLink(user_id, user.username);
        const queryCT = await db.get_affiliatesDB().insertOne({"user_id" : user_id, "is_vendor":false, "ip_address":ip_address, "created_at":new Date(), "aff_short_link": affShortLink, "ai_tickets": 25 }).then((aff)=>{
          resp = aff.insertedId;
          const affEmailSend = email.sendemail('newAffEmail', user.email);
        });
      }
    }
  });
  return resp;
};



async function createAffShortLink(user_id, username) {
  let shortLink;
  const link = "https://scrooge.casino/?"+user_id+"";
  const config = {
      headers:{
          "Authorization": "Bearer "+process.env.OPENMYLINK_API_KEY+"",
          "Content-Type": "application/json"
      }
    };
    const url = "https://openmy.link/api/url/add";
    const data = {
      "url" : link,
      "custom" : username,
      "domain" : "https:\/\/go.scrooge.to",
      "metatitle": "Join me at Scrooge Casino!",
      "metadescription": "Join for free and win real prizes at Scrooge Casino. Play poker, blackjack, slots and much more!"
    };
    await axios.post(url, data, config)
    .then(res => {
      shortLink = res.data.shorturl;
      })
    .catch(err => console.log(err));
    return shortLink;
};

/// get affiliate leaders by Tokens
export async function getAffLeadersByCount(req) {
  let resp;
  let limit;
  if(req.params.limit>0){
    limit = parseInt(req.params.limit);
  } else {
    limit = 1000;
  }
  const days = req.params.days;
  const cursor = db.get_affiliates_successful_actionsDB().aggregate([
      {
          $group: {
            _id: "$user_id",
            count: { $sum: 1 }
          }
      }
  ]).sort({count: -1}).limit(limit);
  const arr = await cursor.toArray().then((data)=>{
      if(typeof data[0]!='undefined'){
        resp = data;
      } else {
        resp = "No Entries Found For User";
      }
  });
  return resp;
};

export default affAddOrder;