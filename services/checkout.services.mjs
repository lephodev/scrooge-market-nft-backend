import axios from "axios";
import qs from "qs";
import { Checkout } from "checkout-sdk-node";
import * as db from "../config/mongodb.mjs";
import { ObjectId } from "mongodb";
import * as rewards from "../config/rewards.mjs";

export const getPaymentSession = async (body) => {
  try {
    const { userId, amount } = body;

    const accessToken = await getAcessToken();
    console.log("userId ==>", accessToken);

    const resp = await axios.post(
      "https://api.checkout.com/payment-sessions",
      {
        amount: amount * 100,
        currency: "USD",
        // "payment_type": "Regular",
        billing: {
          address: {
            country: "US",
          },
        },
        // "billing_descriptor": {
        //   "name": "Test user",
        //   "city": "Los Angeles",
        //   "reference": "Scrooge casino"
        // },
        reference: userId,
        // "description": "Payment for Scrooge GC",
        // "processing": {
        //   "aft": true
        // },
        processing_channel_id: process.env.CHECKOUt_MERCHENT_CHANEL_ID,
        // "expires_on": "2024-10-31T09:15:30Z",
        // "payment_method_configuration": {
        //   "card": {
        //     "store_payment_details": "disabled"
        //   }
        // },
        // "enabled_payment_methods": ["card", "applepay", "googlepay"],
        // "disabled_payment_methods": ["eps", "ideal", "knet"],
        // "items": [{
        //   "reference": "$10 GC",
        //   "commodity_code": "1234",
        //   "unit_of_measure": "each",
        //   "total_amount": 10,
        //   "tax_amount": 0,
        //   "discount_amount": 0,
        //   "url": "string",
        //   "image_url": "string",
        //   "name": "Gold Necklace",
        //   "quantity": 1,
        //   "unit_price": 10
        //   }],
        // "risk": {
        //   "enabled": false
        // },
        // "customer_retry": {
        //   "max_attempts": 5
        // },
        // "display_name": "Test user",
        success_url: `${process.env.CLIENT}/copy-crypto-to-gc`,
        failure_url: `${process.env.CLIENT}/copy-crypto-to-gc/?status=failure`,
        // "metadata": {
        //   "coupon_code": "NY2018"
        // },
        // "locale": "en-GB",
        // "3ds": {
        //   "enabled": true,
        //   "attempt_n3d": true,
        //   "challenge_indicator": "no_preference",
        //   "exemption": "low_value",
        //   "allow_upgrade": true
        // },
        // "sender": {
        //   "type": "individual",
        //   "reference": "8285282045818",
        //   "first_name": "test",
        //   "last_name": "user"
        // },
        // "capture": true,
        // "capture_on": "2024-10-17T11:15:30Z",
        // "ip_address": "49.36.170.1"
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return resp.data;
  } catch (error) {
    console.log("error in get checkout payment session", error);
  }
};

const getAcessToken = async () => {
  try {
    const acsTkResp = await axios.post(
      process.env.CHECKOUT_MERCHENT_URL,
      qs.stringify({
        grant_type: "client_credentials",
        client_id: process.env.CHECKOUT_MERCHENT_CLIENT_ID, //"ack_eiccapfazfletih475sllukdmy",
        client_secret: process.env.CHECKOUT_MERCHENT_CLIENT_SECRET, //"sa3U0dlryEzJ9CtbLzQkDfZ1Bdv963F92SmGKWwmNjt0-V5qDgbtpZmNqUP6_Oh-ztbylzjOlWzNqmxfFY8qmA",
        scope: "payment-sessions",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return acsTkResp.data.access_token;
  } catch (error) {
    console.log("error in get access token in checkout payment ==>", error);
  }
};

export const addCheckoutWorkFlows = async () => {
  try {
    let cko = new Checkout(process.env.CHECKOUT_MERCHENT_CLIENT_SECRET, {
      client: process.env.CHECKOUT_MERCHENT_CLIENT_ID,
      scope: ["flow:workflows"], // array of scopes
      environment: "production", // or "sandbox"
    });
    let workflows = await cko.workflows.add({
      name: "Payment webhooks",
      conditions: [
        {
          type: "event",
          events: {
            gateway: ["payment_approved", "payment_declined"],
          },
        },
        // {
        //   type: 'entity',
        //   entities: ['ent_djigcqx4clmufo2sasgomgpqsq'],
        // },
        {
          type: "processing_channel",
          processing_channels: [process.env.CHECKOUt_MERCHENT_CHANEL_ID],
        },
      ],
      actions: [
        {
          type: "webhook",
          url: "https://market-api.scrooge.casino/api/checkout-payments-webhook",
          headers: {
            Authorization: "scrooge-test",
          },
          signature: {
            method: "HMACSHA256",
            key: "8V8x0dLK%AyD*DNS8JJr",
          },
        },
      ],
    });
    //  web hook https://api.sandbox.checkout.com/workflows/wf_4a2bdxij4wlevafdnx2miulmim
    console.log("webhooks ==>", workflows);
  } catch (error) {
    console.log("error in addCheckoutWorkFlows =>", error);
  }
};

export const getAllCheckoutwebhooks = async () => {
  try {
    let cko = new Checkout(process.env.CHECKOUT_CLIENT_SECRET, {
      client: process.env.CHECKOUT_CLIENT_ID,
      scope: ["flow:workflows"], // array of scopes
      environment: "sandbox", // or "production"
    });
    let workflows = await cko.workflows.getAll();
    //  web hook https://api.sandbox.checkout.com/workflows/wf_4a2bdxij4wlevafdnx2miulmim
    console.log("webhooks ==>", workflows.data[0]._links);
  } catch (error) {
    console.log("error in addCheckoutWorkFlows =>", error);
  }
};

export const checkoutWebHook = async (body) => {
  try {
    let {
      data: { reference, amount },
    } = body;
    const user = await db.get_scrooge_usersDB().findOne({
      _id: ObjectId(reference),
    });

    let query = {
      couponCode: "",
      expireDate: { $gte: new Date() },
    };
    let findPromoData = await db.get_scrooge_promoDB().findOne(query);

    let data;

    const trans = await rewards.addChips(
      user?._id?.toString(),
      findPromoData?.coupanType === "Percent"
        ? parseInt(data ? data.freeTokenAmount : amount) +
            parseInt(data ? data.freeTokenAmount : amount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
        : findPromoData?.coupanType === "2X"
        ? parseInt(data ? data.freeTokenAmount : amount) * 2
        : parseInt(data ? data.freeTokenAmount : amount),
      "",
      "CC To Gold Coin",
      findPromoData?.coupanType === "Percent"
        ? parseInt(data ? data.gcAmount : amount * 1000) +
            parseInt(data ? data.gcAmount : amount * 1000) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
        : findPromoData?.coupanType === "2X"
        ? parseInt(data ? data.gcAmount : amount * 1000) * 2
        : parseInt(data ? data.gcAmount : amount * 1000),
      {},
      findPromoData?.coupanType === "Percent"
        ? parseInt(data ? data.freeTokenAmount : amount) *
            (parseFloat(findPromoData?.discountInPercent) / 100)
        : findPromoData?.coupanType === "2X"
        ? parseInt(data ? data.freeTokenAmount : amount)
        : 0,
      amount / 100 //amount?.toString() === "9.99"
      // ? 1500
      // : 0
    );

    return;
  } catch (error) {
    console.log("web hook in checkout ==>", error);
  }
};
