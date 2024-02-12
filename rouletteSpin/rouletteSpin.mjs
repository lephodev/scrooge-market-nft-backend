import { ObjectId } from "mongodb";
import * as db from "../config/mongodb.mjs";
import spinGameModel from "../models/spinGameModel.mjs";
import {
  BigWheelPlaces,
  LoyaltyWheelPlaces,
  RiskWheelPlaces,
  places,
} from "./roulleteArray.mjs";
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

export async function gameResultForRiskWheel(req, userId) {
  try {
    const { clientSeed } = req.query;
    let container = [];
    RiskWheelPlaces.forEach((el) => {
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

export async function gameResultForBigWheel(req, userId) {
  try {
    const { clientSeed } = req.query;
    let container = [];
    BigWheelPlaces.forEach((el) => {
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

export async function loyalitygameResultWheel(req, userId) {
  try {
    const { clientSeed } = req.query;
    let container = [];
    LoyaltyWheelPlaces.forEach((el) => {
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

export async function updateUserDataAndTransaction(
  req,
  responseData,
  user,
  type
) {
  try {
    const tempData = { ...responseData };

    const { resultData, gameModelData } = tempData;

    const reslt = { ...resultData };

    const { token } = reslt;
    if (
      token === "Red1" ||
      token === "Red2" ||
      token === "Red3" ||
      token === "Red4" ||
      token === "Red5" ||
      token === "Red6" ||
      token === "Red7"
    ) {
      reslt.token = 0;
    }

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
      prevGoldCoin: user.goldCoin,
      updatedGoldCoin: user?.goldCoin,
      updatedWallet: user.wallet + reslt?.token,
      amount: reslt?.token,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight of the next day

    // Convert to Eastern Standard Time (EST)
    const estOffset = -5 * 60; // EST is UTC-5
    const nowEst = new Date(now.getTime() + estOffset * 60 * 1000);
    const tomorrowEst = new Date(now.getTime() + estOffset * 60 * 1000);
    tomorrowEst.setDate(tomorrowEst.getDate() + 1);
    tomorrowEst.setHours(0, 0, 0, 0);
    let spinTime = tomorrowEst - nowEst;

    await Promise.allSettled(
      [
        db.get_scrooge_usersDB().updateOne(
          { _id: ObjectId(req.user._id) },
          {
            $set: {
              lastSpinTime: Date.now() + spinTime,
            },
            $inc: {
              wallet: reslt?.token,
              dailySpinBonus: reslt?.token,
              nonWithdrawableAmt: reslt?.token,
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
    let query = {
      "userId._id": ObjectId(req.user._id),
      transactionType: "spin",
    };

    let getLastDaySpin = await db
      .get_scrooge_transactionDB()
      .find(query)
      .sort({ _id: -1 })
      .skip(1)
      .limit(1)
      .toArray();

    getLastDaySpin = getLastDaySpin[0];
    console.log("getLastDaySpin", getLastDaySpin);

    if (type === "Loyality") {
      console.log("Loyality");
      await db.get_scrooge_usersDB().updateOne(
        { _id: ObjectId(req.user._id) },
        {
          $set: {
            loyalitySpinCount: 0,
          },
        }
      );
    } else {
      if (getLastDaySpin) {
        const prevDt = new Date();
        prevDt.setDate(prevDt.getDate() - 1);
        prevDt.setHours(0, 0, 0, 0);

        const estOffset = -5 * 60; // EST is UTC-5
        const nowEst = new Date(now.getTime() + estOffset * 60 * 1000);
        console.log("nowEst", nowEst);

        console.log(
          "preDtTime ==>",
          prevDt.getTime(),
          "spin time ==>",
          new Date(getLastDaySpin.createdAt),
          new Date(getLastDaySpin.createdAt).getTime(),
          prevDt.getTime() <= new Date(getLastDaySpin.createdAt).getTime()
        );

        if (nowEst.getTime() <= new Date(getLastDaySpin.createdAt).getTime()) {
          console.log("helloooooooooo1");
          await db.get_scrooge_usersDB().updateOne(
            { _id: ObjectId(req.user._id) },
            {
              $inc: {
                loyalitySpinCount: 1,
              },
            }
          );
        } else {
          console.log("helloooooooooo2");
          await db.get_scrooge_usersDB().updateOne(
            { _id: ObjectId(req.user._id) },
            {
              $set: {
                loyalitySpinCount: 0,
              },
            }
          );
        }
      }
    }

    // console.log("getLastDaySpin", getLastDaySpin);
  } catch (error) {
    console.log("error", error);
  }

  // console.log('query==>>>',query)
}

export async function CreateRollOver(req, responseData, user) {
  const { resultData } = responseData;
  const { _id } = user;
  const exprDate = new Date();
  exprDate.setHours(24 * 7 + exprDate.getHours());
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
      expiredAmount: resultData?.token,
      executing: false,
    });
  } catch (error) {
    console.log("error", error);
  }

  // console.log('query==>>>',query)
}
