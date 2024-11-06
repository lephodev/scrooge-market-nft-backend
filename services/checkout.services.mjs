import axios from "axios";
import qs from "qs";
import { Checkout } from "checkout-sdk-node";
import * as db from "../config/mongodb.mjs";
import { ObjectId } from "mongodb";
import * as rewards from "../config/rewards.mjs";
import { InvoiceEmail } from "../email/emailSend.mjs";
import ip from "request-ip";
import moment from "moment";

export const getPaymentSession = async (body, req) => {
  try {
    const {
      userId,
      amount,
      city,
      state,
      zipCode,
      phoneNumber,
      email,
      firstName,
      lastName,
      country,
      address,
      streetAddress,
    } = body;

    console.log("helloo ==>", city, state, zipCode, email, address);

    const accessToken = await getAcessToken();
    console.log("userId ==>", accessToken);

    const payload = {
      amount: amount * 100,
      currency: "USD",
      // "payment_type": "Regular",
      billing: {
        address: {
          address_line1: streetAddress,
          country,
          city,
          state,
          zip: zipCode,
        },
        phone: {
          number: phoneNumber,
        },
      },
      // "billing_descriptor": {
      //   "name": "Test user",
      //   "city": "Los Angeles",
      //   "reference": "Scrooge casino"
      // },
      metadata:{
        "coupon_code": "abcd"
      },
      reference: userId,
      // "description": "Payment for Scrooge GC",
      // "processing": {
      //   "aft": true
      // },
      "3ds": {
        enabled: true,
        attempt_n3d: true,
      },
      shipping: {
        address: {
          address_line1: streetAddress,
          country,
          city,
          state,
          zip: zipCode
        },
        phone: {
          // country_code: "+1",
          number: phoneNumber,
        },
      },
      processing_channel_id: process.env.CHECKOUt_MERCHENT_CHANEL_ID,
      // "expires_on": "2024-10-31T09:15:30Z",
      // "payment_method_configuration": {
      //   "card": {
      //     "store_payment_details": "disabled"
      //   }
      // },
      enabled_payment_methods: ["card", "applepay", "googlepay"],
      // "disabled_payment_methods": ["eps", "ideal", "knet"],
      // metadata: "promo code",
      risk: {
        enabled: false,
      },
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
      description: "promo promo",
      ip_address: ip.getClientIp(req),
      customer: {
        email: email,
        name: firstName + " " + lastName,
        // id: userId.toString(),
        phone: {
          // country_code: "+1",
          number: phoneNumber,
        },
      },
    };

    console.log("payload in checkout payment session", payload);

    const resp = await axios.post(
      "https://api.checkout.com/payment-sessions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return resp.data;
  } catch (error) {
    console.log(
      "error in get checkout payment session",
      // error.data.error_codes,
      JSON.stringify(error)
    );
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

const getGCPurchaseAffliateBonus = async (
  extractedId,
  extractedReffrenceId,
  amount
) => {
  // console.log("888888888888888", extractedId, extractedReffrenceId, amount);
  try {
    let getUserdetails = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedId) });
    // console.log("getUsergetUser", getUserdetails);
    let affliateData = await db
      .get_affiliatesDB()
      .findOne({ userId: extractedId });
    let getAdminSettings = await db.get_db_admin_settingDB().findOne({});
    const { cryptoToGcReferalBonus } = getAdminSettings;
    let getTicketBonus =
      (cryptoToGcReferalBonus / 100) * parseInt(amount * 100);
    // console.log(
    //   "getTicketBonus",
    //   getTicketBonus,
    //   amount,
    //   cryptoToGcReferalBonus
    // );
    let affliateUserDetails = {
      commission: getTicketBonus,
      monthly_earned: getTicketBonus,
      referred_user_id: extractedReffrenceId && ObjectId(extractedReffrenceId),
      affiliate_id: affliateData?._id || null,
      userId: ObjectId(extractedId),
      transactionType: "CC to Gc",
      purchaseAmount: amount,
      tokenAmount: getUserdetails?.wallet,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.get_db_affiliates_transactionDB().insertOne(affliateUserDetails);
    // let getUser = await db.get_scrooge_usersDB().findOneAndUpdate(
    //   { _id: ObjectId(extractedReffrenceId) },
    //   {
    //     $inc: { wallet: getTicketBonus },
    //   },
    //   { new: true }
    // );

    db.get_affiliatesDB().findOneAndUpdate(
      { userId: ObjectId(extractedReffrenceId) },
      {
        $inc: {
          // total_earned: getTicketBonus,
          // monthly_earned: getTicketBonus,
        },
      },
      { new: true }
    );

    await db.get_scrooge_usersDB().findOneAndUpdate(
      { _id: ObjectId(extractedId) },
      {
        $inc: {
          totalBuy: parseFloat(amount),
          totalProfit: parseFloat(amount),
        },
      }
    );
    let getUser = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedReffrenceId) });
    let getUserData = await db
      .get_scrooge_usersDB()
      .findOne({ _id: ObjectId(extractedReffrenceId) });

    // console.log("-----------------", getUserData);
    const {
      _id: referUserId,
      username: referUserName,
      email: referUserEmail,
      firstName: referUserFirstName,
      lastName: referUserLastName,
      profile: referUserProfile,
    } = getUserData;
    const transactionPayload = {
      amount: getTicketBonus,
      transactionType: "CC To Gc bonus",
      prevWallet: getUser?.value?.wallet,
      updatedWallet: getUser?.value?.wallet,
      // userId: ObjectId(refrenceId),

      userId: {
        _id: referUserId,
        username: referUserName,
        email: referUserEmail,
        firstName: referUserFirstName,
        referUserLastName,
        profile: referUserProfile,
        ipAddress: getUserData?.ipAddress,
      },

      updatedTicket: getUser?.value?.ticket + getTicketBonus,
      prevGoldCoin: getUser?.value?.goldCoin,
      updatedGoldCoin: getUser?.value?.goldCoin,
      createdAt: new Date(),
      updatedAt: new Date(),
      prevTicket: getUser?.value?.ticket,
    };
    await db.get_scrooge_transactionDB().insertOne(transactionPayload);
  } catch (error) {
    console.log("error", error);
  }
};

export const checkoutWebHook = async (body) => {
  try {
    let {
      data: { reference, amount },
    } = body;

    amount = amount / 100;
    const getUser = await db.get_scrooge_usersDB().findOne({
      _id: ObjectId(reference),
    });

    const extractedReffrenceId = getUser?.refrenceId || null;
    const extractedPromoCode = null; // parts[1] || null

    if (amount) {
      const data = await db.get_marketplace_gcPackagesDB().findOne({
        priceInBUSD: amount?.toString(),
      });

      let query = {
        couponCode: "",
        expireDate: { $gte: new Date() },
      };
      let findPromoData = await db.get_scrooge_promoDB().findOne(query);

      const trans = await rewards.addChips(
        getUser?._id?.toString(),
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.freeTokenAmount) +
              parseInt(data.freeTokenAmount) *
                (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.freeTokenAmount) * 2
          : parseInt(data.freeTokenAmount),
        "",
        "CC To Gold Coin",
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.gcAmount) +
              parseInt(data.gcAmount) *
                (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.gcAmount) * 2
          : parseInt(data.gcAmount),
        body,
        findPromoData?.coupanType === "Percent"
          ? parseInt(data.freeTokenAmount) *
              (parseFloat(findPromoData?.discountInPercent) / 100)
          : findPromoData?.coupanType === "2X"
          ? parseInt(data.freeTokenAmount)
          : 0,
        amount //amount?.toString() === "9.99"
        // ? 1500
        // : 0
      );
      const reciptPayload = {
        username: getUser?.username,
        email: getUser?.email,
        invoicDate: moment(new Date()).format("D MMMM  YYYY"),
        paymentMethod: "Credit Card Purchase",
        packageName: "Gold Coin Purchase",
        goldCoinQuantity: parseInt(data?.gcAmount),
        tokenQuantity: parseInt(data?.freeTokenAmount),
        purcahsePrice: amount?.toString(),
        Tax: 0,
        firstName: getUser?.firstName,
        lastName: getUser?.lastName,
      };
      if (data?.offerType === "MegaOffer") {
        await db.get_scrooge_usersDB().findOneAndUpdate(
          { _id: ObjectId(reference) },

          { $push: { megaOffer: parseFloat(amount) } }
        );
      }
      if (data?.offerType === "freeSpin") {
        let freeSpinPayload = {
          amount: data?.numberofSpins,
          currency: data.currency,
          freespinvalue: data?.freespinValue,
          gameid: data?.freeSpinGame,
          remoteusername: reference,
        };
        let spinRes = createFreeSpin(freeSpinPayload);
        await db.get_scrooge_usersDB().findOneAndUpdate(
          { _id: ObjectId(reference) },

          { $push: { freeSpin: parseFloat(amount) } }
        );
      }

      const result = await db
        .get_scrooge_usersDB()
        .findOneAndUpdate(
          { _id: ObjectId(reference) },
          { $set: { isSpended: true } }
        );

      // console.log("ssss", result);

      await InvoiceEmail(getUser?.email, reciptPayload);
      if (extractedPromoCode) {
        let payload = {
          userId: reference,
          claimedDate: new Date(),
        };

        let promoFind = await db
          .get_scrooge_promoDB()
          .findOne({ couponCode: extractedPromoCode.trim() });
        await db.get_scrooge_promoDB().findOneAndUpdate(
          { couponCode: extractedPromoCode.trim() },
          {
            $push: { claimedUser: payload },
          },
          {
            new: true,
          }
        );
      }
      if (extractedReffrenceId) {
        getGCPurchaseAffliateBonus(
          reference,
          extractedReffrenceId,
          parseFloat(amount)
        );
      }

      return;
    }
  } catch (error) {
    console.log("web hook in checkout ==>", error);
  }
};
