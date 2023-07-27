import rateLimit from "express-rate-limit";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { getClientIp } from "request-ip";
import { getIpAdress } from "./IpAddress.mjs";

const MAX_REQUEST_LIMIT = 4000;
const MAX_REQUEST_WINDOW = 24 * 60 * 60; // Per 24 hours by IP
const TOO_MANY_REQUESTS_MESSAGE = "Too many requests found";
const options = {
  duration: MAX_REQUEST_WINDOW,
  points: MAX_REQUEST_LIMIT,
};
const rateLimiter = new RateLimiterMemory(options);
const authLimiter = (req, res, next) => {
  const ipadd = getClientIp(req);
  const ipAddress = getIpAdress(ipadd);
  console.log("limiter IP triggered", ipAddress);
  rateLimiter
    .consume(ipAddress)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ message: TOO_MANY_REQUESTS_MESSAGE });
    });
};

export default authLimiter;
