import * as db from "./mongodb.mjs";
import * as useSDK from "./sdk.mjs";
import { ObjectId } from "mongodb";
import axios from "axios";

export async function getSharableMessages(req, res) {
  const qry = { category: "casino_aff" };
  try {
    const cursor = await db.get_sharing_messagesDB().find(qry);
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

export async function getShortLink(req, res) {
  const { link } = req.params.link;
  //console.log("Start of getShortLink");
  let shortLink;
  const config = {
    headers: {
      Authorization: "Bearer " + process.env.OPENMYLINK_API_KEY + "",
      "Content-Type": "application/json",
    },
  };
  const url = "https://scrooge.to/api/url/add";
  const data = { url: link };
  try {
    const res = await axios.post(url, data, config);
    //console.log('shorturl: ', res.data.shorturl);
    shortLink = res.data.shorturl;
    return res.status(200).send({ success: true, data: shortLink });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Request Process" });
  }

  /*try {
        await axios.get(`https://openmy.link/api/url/add`).then((data)=>{
            affilateUser = data.data;
            return data.data;
        });
    } catch (err) {
        console.error(err);
    };
    console.log("data: ", affilateUser); */
}

export const shareReward = async (req, res) => {
  try {
    console.log("req.params", req.params);
    const { user_id, message_id } = req.params;
    let getuser=  await db
    .get_scrooge_usersDB()
    .findOne(
      { _id: ObjectId(user_id) });

    let currentPost = await db
      .get_scrooge_socialShare()
      .find({ user: ObjectId(user_id) })
      .toArray();
    const lastTransactions = await db
      .get_scrooge_socialShare()
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
            },
            user: ObjectId(user_id),
            // post: ObjectId(message_id),
          },
        },
        {
          $group: {
            _id: null,
            totalShare: { $count: {} },
          },
        },
      ])
      .toArray();
    console.log("lastTransactions", lastTransactions);

    if (lastTransactions[0]?.totalShare > 19) {
      getuser.id=getuser._id
      return res
        .status(200)
        .send({
          success: true,
          code: 403,
          message: `Sorry you have reached your redeem limit for today`,
          user:getuser
        });
    } else {
      console.log("currentPost", currentPost.length);
      const Payload = {
        user: ObjectId(user_id),
        post: ObjectId(message_id),
        reward: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const query = await db
        .get_scrooge_socialShare()
        .insertOne(Payload)
        .then(async (trans) => {
          const query = await db
            .get_scrooge_usersDB()
            .findOneAndUpdate(
              { _id: ObjectId(user_id) },
              { $inc: { wallet: 10 } },


            );
            let getuserData=  await db
            .get_scrooge_usersDB()
            .findOne(
              { _id: ObjectId(user_id) });
            const transactionPayload = {
              amount: 10,
              transactionType: "share reward",
              prevWallet: getuserData?.wallet,
              updatedWallet: getuserData?.wallet + 10,
              userId: ObjectId(user_id),
              updatedTicket: 10,
              createdAt:new Date(),
              updatedAt:new Date()
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
              
  
           
           getuserData.id=getuserData._id
          return res.status(200).send({ success: true, code: 200,user:getuserData });
        });
    }
  } catch (error) {
    console.log("error", error);
  }
};

export const getSocialShare=async(req,res)=>{
  try {
    console.log("req.params------", req.params);
    const { user_id } = req.params;
    const lastTransactions = await db
      .get_scrooge_socialShare()
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
            },
            user: ObjectId(user_id)
          },
        },
        {
          $group: {
            _id: null,
            totalShare: { $count: {} },
          },
        },
      ])
      .toArray();
    console.log("lastTransactions", lastTransactions);
    return res.status(200).send({ success: true, code: 200,count:lastTransactions[0]?.totalShare });
  } catch (error) {
    console.log("error", error);
  }
}
