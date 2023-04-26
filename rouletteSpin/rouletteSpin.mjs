import { ObjectId } from "mongodb";
import * as db from "../config/mongodb.mjs";
import spinGameModel from "../models/spinGameModel.mjs";
import { places } from "./roulleteArray.mjs";
import { generateServerSeed, verifyResult } from "./rouletteUtils.mjs";

export async function gameResult(req, userId) {
  try {
    const { clientSeed } = req.query;
  let container = [];
  places.forEach((el) => {
    for (let i = 0.0; i < el.chances; i = i + 0.01) {
      container.push(el);
    }
  });
  let nonce = await db.get_scrooge_spinGameDB().countDocuments({ userId });
  if (!nonce) nonce = 0;
  const serverSeed = generateServerSeed();
  const resultIndex = verifyResult(
    serverSeed,
    clientSeed,
    nonce + 1,
    container.length
  );
  const resultData = container[resultIndex];
  return {
    code: 200,
    resultData,
    gameModelData: { serverSeed, clientSeed, nonce: nonce + 1, userId },
  };
  } catch (error) {
    console.log('error',error)
  }
  
}

export async function updateUserDataAndTransaction(req, responseData, user) {
  try {
    const { resultData, gameModelData } = responseData;
    const payload = {
      userId: req.user._id,
      transactionType: "spin",
      status: "spin-win",
      prevWallet: user.wallet,
      previousTickets: user.ticket,
      prevGoldCoin: user.goldCoin,
      updatedGoldCoin: user.goldCoin + resultData?.gc,
      updatedWallet: user.wallet + resultData?.token,
      updatedTicket: user.ticket,
    };
  
     await Promise.allSettled(
      [
        db.get_scrooge_usersDB().updateOne(
          { _id: ObjectId(req.user._id) },
          {
            $set: {
              lastSpinTime: Date.now() + 120000,
            },
            $inc: { wallet: resultData?.token, goldCoin: resultData?.gc },
          }
        ),
        db.get_scrooge_spinGameDB().insert(gameModelData),
      ],
      db.get_scrooge_transactionDB().insertOne(payload)
    );
  } catch (error) {
    console.log('error',error)
  }
 

  // console.log('query==>>>',query)
}
