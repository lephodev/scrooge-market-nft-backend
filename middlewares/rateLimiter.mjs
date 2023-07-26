import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  max: 4,
  skipSuccessfulRequests: false,
  message: { message: "To many requests found" },
  statusCode: 429,
});

export default authLimiter;
