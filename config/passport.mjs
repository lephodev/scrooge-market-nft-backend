import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import tokenTypes from "./tokens.mjs";
import { ObjectId } from "mongodb";
import * as db from "./mongodb.mjs";

const cookieExtractor = (req) => {
  let jwt = null;

  if (req && req.cookies) {
    jwt = req.cookies['token'];
  }
  return jwt;
};

const jwtOptions = {
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() || cookieExtractor,
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }
    const user = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(payload.sub) });
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export default jwtStrategy;
