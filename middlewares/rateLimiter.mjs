import rateLimit from "express-rate-limit";
import { RateLimiterMemory } from "rate-limiter-flexible";
// const authLimiter = rateLimit({
//   windowMs: 5 * 60 * 1000, // 24 hours in milliseconds
//   max: 4,
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false,
//   message: { message: "To many requests found" },
//   statusCode: 429,
// });

const MAX_REQUEST_LIMIT = 2;
const MAX_REQUEST_WINDOW = 5 * 60; // Per 5 minutes by IP
const TOO_MANY_REQUESTS_MESSAGE = "Too many requests";

const options = {
  duration: MAX_REQUEST_WINDOW,
  points: MAX_REQUEST_LIMIT,
};
const rateLimiter = new RateLimiterMemory(options);
const authLimiter = (req, res, next) => {
  console.log("limiter IP triggered", req.ip);
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ message: "TOO_MANY_REQUESTS_MESSAGE" });
    });
};

export default authLimiter;
