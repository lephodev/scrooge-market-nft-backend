import { ObjectId } from 'mongodb';
import * as db from './mongodb.mjs';
import * as useSDK from './sdk.mjs';
import { addChips } from './rewards.mjs';
import axios from 'axios';

export async function getUserByUserID(user_id){
    let resp;
    const query = await db.get_scrooge_usersDB().findOne({_id : ObjectId(user_id)}).then(async (user)=>{
      if(user){
        resp = user;
      } else {
        resp = null;
      }
    });
    return resp;
  }

  export async function getUserByEmail(email_address){
    let resp;
    const query = await db.get_scrooge_usersDB().findOne({"email" : email_address}).then(async (user)=>{
      if(user){
        resp = user;
      } else {
        resp = null;
      }
    });
    return resp;
  }