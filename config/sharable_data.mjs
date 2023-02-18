import * as db from './mongodb.mjs';
import * as useSDK from './sdk.mjs';
import { ObjectId } from 'mongodb';
import axios from 'axios';

export async function getSharableMessages(req) {
    let resp;
    const qry = { "category" : "casino_aff"};
    const cursor = db.get_sharing_messagesDB().find(qry);
    const arr = await cursor.toArray().then((data)=>{
        if(typeof data[0]!='undefined'){
            resp = data;
        } else {
            resp = false;
        }
    });
    return resp;
};

export async function getShortLink(req) {
    const link = req.params.link;
    //console.log("Start of getShortLink");
    let shortLink;
    const config = {
        headers:{
            "Authorization": "Bearer "+process.env.OPENMYLINK_API_KEY+"",
            "Content-Type": "application/json"
        }
      };
      const url = "https://scrooge.to/api/url/add";
      const data = {"url" : link};
      await axios.post(url, data, config)
      .then(res => {
        //console.log('shorturl: ', res.data.shorturl);
        shortLink = res.data.shorturl;
        })
      .catch(err => console.log(err));
      return shortLink;


    
    /*try {
        await axios.get(`https://openmy.link/api/url/add`).then((data)=>{
            affilateUser = data.data;
            return data.data;
        });
    } catch (err) {
        console.error(err);
    };
    console.log("data: ", affilateUser); */
    
};

