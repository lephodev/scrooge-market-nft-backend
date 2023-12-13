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
      for (let i = 0.0; i < el.chances; i = i + 0.1) {
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
      gameModelData: {
        serverSeed,
        clientSeed,
        nonce: nonce + 1,
        userId,
        resultIndex,
        rouletteItems: places,
        containerLength: container.length,
        winItem: resultData,
      },
    };
  } catch (error) {
    console.log("error", error);
  }
}

export async function updateUserDataAndTransaction(req, responseData, user) {
  try {
    const { resultData, gameModelData } = responseData;
    const { _id, username, email, firstName, lastName, profile, ipAddress } =
      user;
    const payload = {
      userId: {
        _id,
        username,
        email,
        firstName,
        lastName,
        profile,
        ipAddress,
      },
      transactionType: "spin",
      status: "spin-win",
      prevWallet: user.wallet,
      previousTickets: user.ticket,
      prevGoldCoin: user.goldCoin,
      updatedGoldCoin: user.goldCoin + resultData?.gc,
      updatedWallet: user.wallet + resultData?.token,
      updatedTicket: user.ticket,
      amount: resultData?.gc + resultData?.token,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await Promise.allSettled(
      [
        db.get_scrooge_usersDB().updateOne(
          { _id: ObjectId(req.user._id) },
          {
            $set: {
              lastSpinTime: Date.now() + 86400000,
            },
            $inc: {
              wallet: resultData?.token,
              goldCoin: resultData?.gc,
              // dailySpinBonus: resultData?.token,
              // nonWithdrawableAmt: resultData?.token,
            },
          }
        ),
        db.get_scrooge_spinGameDB().insert({
          ...gameModelData,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ],
      db.get_scrooge_transactionDB().insertOne(payload)
    );
  } catch (error) {
    console.log("error", error);
  }

  // console.log('query==>>>',query)
}

export async function CreateRollOver(req, responseData, user) {
  const { resultData } = responseData;
  const { _id } = user;
  const exprDate = new Date();
  exprDate.setHours(24 + exprDate.getHours());
  exprDate.setSeconds(0);
  exprDate.setMilliseconds(0);

  try {
    await db.get_scrooge_bonus().insert({
      userId: _id,
      bonusType: "daily",
      bonusAmount: resultData?.token,
      bonusExpirationTime: exprDate,
      wagerLimit: resultData?.token,
      rollOverTimes: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isExpired: false,
      wageredAmount: 0,
      subCategory: "Daily Spin",
      restAmount: resultData?.token,
    });
  } catch (error) {
    console.log("error", error);
  }

  // console.log('query==>>>',query)
}
