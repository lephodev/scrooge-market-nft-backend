import nodemailer from "nodemailer";
import {
  APPROVE_REDEEM_REQUEST,
  SEND_INVOICE,
  SUBMIT_REDEEM_REQUEST,
} from "./mailTemplate.mjs";
console.log("process.env.SMTP_PASSWORD", process.env.SMTP_PASSWORD);
const redeemtransport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: process.env.REDEMPTION_SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

const Invoicetransport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: process.env.INVOICE_SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

let merch_coupon_code, email_subject, email_text, email_html;

// export async function sendemail(message, email_address, coupon_code=null) {
//     console.log("message",message);
//     console.log("Message sent: %s", email_address);
//     return true
// }

export const redeemSendemail = async (to, subject, text, html) => {
  try {
    const msg = {
      from: process.env.REDEMPTION_SMTP_USERNAME,
      to,
      subject,
      text,
      html,
    };
    await redeemtransport.sendMail(msg);
  } catch (error) {
    console.log("error", error);
  }
};

export const InvoiceSendemail = async (to, subject, text, html) => {
  try {
    const msg = {
      from: process.env.INVOICE_SMTP_USERNAME,
      to,
      subject,
      text,
      html,
    };
    await Invoicetransport.sendMail(msg);
  } catch (error) {
    console.log("error", error);
  }
};

export const SubmitRedeemRequestEmail = async (to, name, prize) => {
  try {
    console.log("to, name", to, name);
    let subject = "Submit Redeem Request";
    const text = ``;
    // const html = SUBMIT_REDEEM_REQUEST(name, prize);
    // await redeemSendemail(to, subject, text, html);
  } catch (error) {
    console.log("error", error);
  }
};

export const ApproveRedeemRequestEmail = async (
  to,
  prize_price,
  name,
  hash,
  from
) => {
  console.log("to, name", to, name);
  let subject = "Approve Redeem Request";
  const text = ``;
  const html = APPROVE_REDEEM_REQUEST(prize_price, name, hash, from);
  await redeemSendemail(to, subject, text, html);
};

export const InvoiceEmail = async (to, name, hash, from) => {
  console.log("to, name", to, name);
  let subject = "Invoice";
  const text = ``;
  const html = SEND_INVOICE(name);
  await InvoiceSendemail(to, subject, text, html);
};
