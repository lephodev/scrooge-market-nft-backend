import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 24 hours in milliseconds
  max: 4,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: { message: "To many requests found" },
  statusCode: 429,
});

export default authLimiter;
