import { ObjectId } from "mongodb";
import * as db from "./mongodb.mjs";
import * as commons from "./commons.mjs";
import * as useSDK from "./sdk.mjs";
import { addChips } from "./rewards.mjs";
import axios from "axios";
import * as email from "../email/email.mjs";
import moment from "moment/moment.js";

let base_url = "https://market.scrooge.casino";
const order_commission_pct = 10;

/// Add Order to affiliate system
export async function affAddOrder(
  aff_id,
  order_id,
  order_total,
  product_id,
  user_id,
  address
) {
  console.log("aff_id","order_id",
  "order_total",
  "product_id",
  "user_id",
  "address", aff_id,
  order_id,
  order_total,
  product_id,
  user_id,
  address);
  //write transaction to successful_actions table
  let resp;
  let trans_id;

  console.log("order_total",order_total);
  const commission = (order_total / order_commission_pct).toFixed(0);
  const query = await db
    .get_affiliatesDB()
    .findOne({ _id: ObjectId(aff_id) })
    .then(async (user) => {
      console.log("userrrrrrr",user);
      if (user) {
        const queryCT = await db
          .get_affiliates_successful_actionsDB()
          .insertOne({
            type: "order",
            user_id: user_id,
            url: base_url,
            data: {
              order_id: order_id,
              product_id: product_id,
              order_value: order_total,
              referred_user_address: address,
            },
            commission: parseInt(commission),
            referred_user_id: user_id,
            timestamp: new Date(),
            affiliate_id: user._id.toString(),
          })
          .then(async (aff) => {
            trans_id = aff.insertedId;
            const query = await db
              .get_affiliatesDB()
              .findOneAndUpdate(
                { user_id: user_id },
                {
                  $inc: { total_earned: parseInt(commission) },
                  $set: { last_earned_at: new Date() },
                }
              )
              .then(async (affUser) => {
                if (affUser) {
                  const queryCT2 = await db
                    .get_marketplace_chip_transactionsDB()
                    .insertOne({
                      user_id: user_id,
                      address: null,
                      chips: parseInt(commission),
                      timestamp: new Date(),
                      aff_data: {
                        type: "aff commission",
                        successful_action_id: trans_id.toString(),
                      },
                    })
                    .then(async (chipTrans) => {
                      //add chips to aff's casino wallet
                      const query3 = await db
                        .get_scrooge_usersDB()
                        .findOneAndUpdate(
                          { _id: ObjectId(user_id) },
                          { $inc: { wallet: parseInt(commission) } }
                        )
                        .then(async (affChips) => {
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
}

//*-tested get affiliate leaders by Tokens
export async function getAffLeadersByTokens(req, res) {
  let { limit, days } = req.params;

  if (!limit || limit <= 0) {
    limit = 1000;
  } else {
    limit = parseInt(limit);
  }
  if (!days || days <= 0) {
    days = 5000;
  } else {
    days = parseInt(days);
  }

  try {
    let daterange = new Date();
    daterange.setDate(daterange.getDate() - days);
    const cursor = await db
      .get_affiliates_successful_actionsDB()
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: moment(daterange).toDate(),
            },
          },
        },
        {
          $group: {
            _id: "$user_id",
            totalCommission: { $sum: "$commission" },
          },
        },
      ])
      .sort({ totalCommission: -1 })
      .limit(limit);

    const data = await cursor.toArray();
    //console.log('cursor: ', data);
    if (typeof data[0] != "undefined") {
      return res.status(200).send({ success: true, data: data });
    } else {
      return res.send({
        success: false,
        message: "No Entries Found For User",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

//* get affiliate leaders by Type
export async function getAffLeadersByType(req, res) {
  let { type, limit, days } = req.params;
  console.log("req.params",req.params);

  if (!type) return res.status(500).send({ message: "Invalid type" });

  if (!limit || limit <= 0) {
    limit = 1000;
  } else {
    limit = parseInt(limit);
  }
  if (!days || days <= 0) {
    days = 5000;
  } else {
    days = parseInt(days);
  }
  try {
    console.log("days",days);

    let daterange = new Date();
    daterange.setDate(daterange.getDate() - days);
    console.log("daterange",moment(daterange).toDate());
    const cursor = await db
      .get_affiliates_successful_actionsDB()
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: moment(daterange).toDate(),
            },
            type: type,
          },
        },
        {
          $group: {
            _id: "$user_id",
            totalCommission: { $sum: "$commission" },
          },
        },
      ])
      .sort({ totalCommission: -1 })
      .limit(limit);

    const data = await cursor.toArray();
    if (typeof data[0] != "undefined") {
      return res.status(200).send({ success: true, data: data });
    } else {
      return res.send({
        success: false,
        message: "No Entries Found For User",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}
// *-tested
export async function getAffiliateUser(req, res) {
  const { user_id } = req.params;
  console.log("user_id", user_id);
  if (!user_id) return res.status(500).send({ message: "Invalid UserId" });
  console.log("affiatestart");
  try {
    const query = await db.get_affiliatesDB().findOne({ user_id: user_id });
    console.log("query", query);
    if (query) {
      return res.status(200).send({ success: true, data: query });
    }
    return res.send({ success: false, message: "User not found." });
  } catch (error) {
    console.log("affialcatch");
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

// *-tested Route to create Affiliate user
export async function createAffiliateUser(req, res) {
  const { user_id, ip_address } = req.params;
  if (!user_id) return res.status(500).send({ message: "Invalid UserId" });
  if (!ip_address)
    return res.status(500).send({ message: "Invalid IpAddress" });

  try {
    const user = await db.get_affiliatesDB().findOne({ user_id: user_id });
    if (user) {
      res.send({
        success: false,
        message: "You are already registered as an affiliate.",
      });
    } else {
      const user = await commons.getUserByUserID(user_id);
      if (!user) {
        res.send({
          success: false,
          message: "User ID Not Found.",
        });
      } else {
        const affShortLink = await createAffShortLink(user_id, user.username);
        console.log("affShortLink",affShortLink);
        const aff = await db.get_affiliatesDB().insertOne({
          user_id: user_id,
          is_vendor: false,
          ip_address: ip_address,
          created_at: new Date(),
          aff_short_link: affShortLink,
          ai_tickets: 25,
        });
        const affEmailSend = email.sendemail("newAffEmail", user.email);
        return res.status(200).send({ success: true, data: aff.insertedId });
      }
    }
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

//
async function createAffShortLink(user_id, username) {
  console.log("KKKKKKLLLLLIIINKKKKK");
  let shortLink;
  const link = `${process.env.LANDING_CLIENT}?uid=` + user_id + "";
  const config = {
    headers: {
      Authorization: "Bearer " + process.env.OPENMYLINK_API_KEY + "",
      "Content-Type": "application/json",
    },
  };
  const url = "https://openmy.link/api/url/add";
  const data = {
    url: link,
    custom: "afflinkss",
    domain: "https://go.scrooge.to",
    metatitle: "Join me at Scrooge Casino!",
    metadescription:
      "Join for free and win real prizes at Scrooge Casino. Play poker, blackjack, slots and much more!",
  };
  await axios
    .post(url, data, config)
    .then((res) => {
      shortLink = res.data.shorturl;
    })
    .catch((err) => console.log(err));
  return shortLink;
}

// *-tested get affiliate leaders by Tokens
export async function getAffLeadersByCount(req, res) {
  console.log("getAffLeadersByCount");
  let { limit, days } = req.params;

  if (!limit || limit <= 0) {
    limit = 1000;
  } else {
    limit = parseInt(limit);
  }
  try {
    const cursor = await db
      .get_affiliates_successful_actionsDB()
      .aggregate([
        {
          $group: {
            _id: "$user_id",
            count: { $sum: 1 },
          },
        },
      ])
      .sort({ count: -1 })
      .limit(limit);
    const data = await cursor.toArray();
    console.log("countby", data);
    if (typeof data[0] != "undefined") {
      return res.status(200).send({ success: true, data: data });
    } else {
      return res.send({ success: false, message: "No Entries Found For User" });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }
}

export default affAddOrder;
