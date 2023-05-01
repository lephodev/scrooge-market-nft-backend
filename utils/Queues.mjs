import Queue from "better-queue";
import * as rewards from "../config/rewards.mjs";

   export const TicketToTokenQueue = new Queue(async(inputReq, cb) => {
        await rewards.convertPrice(inputReq.req, inputReq.res);
        cb(null, true);
    });

    export const CryptoToGCQueue = new Queue(async(inputReq, cb) => {
        await rewards.convertCryptoToGoldCoin(inputReq.req, inputReq.res);
        cb(null, true);
    });
