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
