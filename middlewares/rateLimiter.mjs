import rateLimit from "express-rate-limit";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { getClientIp } from "request-ip";
import { getIpAdress } from "./IpAddress.mjs";
import * as db from "../config/mongodb.mjs";
import { ObjectId } from "mongodb";
const requestCounts = {};

const MAX_REQUEST_LIMIT = 5;
const MAX_REQUEST_WINDOW = 24 * 60 * 60; // Per 24 hours by IP
const TOO_MANY_REQUESTS_MESSAGE = "Too many requests found";
const options = {
  duration: MAX_REQUEST_WINDOW,
  points: MAX_REQUEST_LIMIT,
};
const rateLimiter = new RateLimiterMemory(options);
export const authLimiter = async (req, res, next) => {
  const tranCount = db.get_scrooge_transactionDB().find({
    "userId._id": ObjectId(req?.user?._id),
    transactionType: "CC To Gold Coin",
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 0)),
    },
  });
  const dr = await tranCount.toArray();
  if (dr?.length > MAX_REQUEST_LIMIT) {
    return res.status(429).json({ message: TOO_MANY_REQUESTS_MESSAGE });
  }
  next();
  // console.log('transaction count-->', dr)
  // const ipadd = getClientIp(req)
  // const ipAddress = getIpAdress(ipadd)
  // console.log('limiter IP triggered', ipAddress)
  // rateLimiter
  //   .consume(ipAddress)
  //   .then(() => {
  //     //next()
  //   })
  //   .catch(() => {
  //     res.status(429).json({ message: TOO_MANY_REQUESTS_MESSAGE })
  //   })
};

export const rateAuthLimit = (req, res, next) => {
  console.log(req.body);
  let time = 0;
  const { promocode } = req.body || {};
  console.log("promocode", promocode);
  if (promocode) {
    time = 10 * 1000;
  } else {
    time = 24 * 60 * 60;
  }
  console.log("time", req.user?._id);
  try {
    const userId = req.user?._id; // Assuming you have a user identifier in headers
    // console.log('userId', userId);
    if (!userId) {
      return res.status(401).json({ message: "User ID not provided" });
    }

    // Define rate limit rules
    const rateLimit = 1; // 1 requests 24 hours
    const windowMs = time;
    // Check if the user has exceeded the rate limit
    if (!requestCounts[userId]) {
      requestCounts[userId] = [];
    }

    const currentTime = Date.now();
    const userRequests = requestCounts[userId].filter((timestamp) => {
      return currentTime - timestamp < windowMs;
    });

    if (userRequests.length >= rateLimit) {
      console.log("Rate limit exceeded");
      return res.status(429).json({ message: "Rate limit exceeded" });
    }

    // Store the current request timestamp
    requestCounts[userId].push(currentTime);

    // Remove timestamps that are older than the window
    requestCounts[userId] = requestCounts[userId].filter((timestamp) => {
      return currentTime - timestamp < windowMs;
    });

    next();
  } catch (error) {
    console.log("error", error);
  }
};
