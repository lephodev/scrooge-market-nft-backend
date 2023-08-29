import passport from "passport";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.mjs";
import { roleRights } from "../config/roles.mjs";
import { decryptPass } from "./decrypt.mjs";

const verifyCallback =
  (req, resolve, reject, requiredRights) => async (err, user, info) => {
    if (err || info || !user) {
      return reject(
        new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
      );
    }
    req.user = user;
    // console.log("user", user)
    if (requiredRights.length) {
      const userRights = roleRights.get(user.role);
      const hasRequiredRights = requiredRights.every((requiredRight) =>
        userRights.includes(requiredRight)
      );
      if (!hasRequiredRights && req.params.userId !== user.id) {
        return reject(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
      }
    }

    resolve();
  };

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    let decryptedToken = decryptPass(req.cookies["token"]);
    req.headers.authEncrypted = req.headers.authorization;
    req.headers.authorization = `Bearer ${decryptedToken}`;
    return new Promise((resolve, reject) => {
      passport.authenticate(
        "jwt",
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => {
        console.log("erororororor", err);
        res.status(400).send({ message: "Please authenticate" });
        // next(err);
      });
  };

export default auth;
