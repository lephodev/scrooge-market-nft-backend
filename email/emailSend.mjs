import nodemailer from "nodemailer";
import {
  APPROVE_REDEEM_REQUEST,
  SEND_INVOICE,
  SUBMIT_REDEEM_REQUEST,
} from "./mailTemplate.mjs";
console.log("process.env.SMTP_PASSWORD", process.env.SMTP_PASSWORD);
const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

let merch_coupon_code, email_subject, email_text, email_html;

// export async function sendemail(message, email_address, coupon_code=null) {
//     console.log("message",message);
//     console.log("Message sent: %s", email_address);
//     return true
// }

export const sendemail = async (to, subject, text, html) => {
  try {
    const msg = { from: process.env.SMTP_USERNAME, to, subject, text, html };
    await transport.sendMail(msg);
  } catch (error) {
    console.log("error", error);
  }
};

export const SubmitRedeemRequestEmail = async (to, name, prize) => {
  console.log("to, name", to, name);
  let subject = "Submit Redeem Request";
  const text = ``;
  const html = SUBMIT_REDEEM_REQUEST(name, prize);
  await sendemail(to, subject, text, html);
};

export const ApproveRedeemRequestEmail = async (to, name, hash, from) => {
  console.log("to, name", to, name);
  let subject = "Approve Redeem Request";
  const text = ``;
  const html = APPROVE_REDEEM_REQUEST(name, hash, from);
  await sendemail(to, subject, text, html);
};

export const InvoiceEmail = async (to, name, hash, from) => {
  console.log("to, name", to, name);
  let subject = "Approve Redeem Request";
  const text = ``;
  const html = SEND_INVOICE(name);
  await sendemail(to, subject, text, html);
};

//     console.log("message",message,"email_address",email_address,"coupon_code",coupon_code);
//     if (coupon_code) {
//         merch_coupon_code = coupon_code;
//     }
//     /*const to = req.params.to;
//     const subject = req.params.subject;
//     const body = req.params.body;*/
//     if (message === 'merchEmail'){
//         email_subject = merchEmailSubject;
//         email_text = merchEmailText.replace('merch_coupon_code', merch_coupon_code);
//         email_html = merchEmail.replace('merch_coupon_code', merch_coupon_code);
//     } else if (message === 'newAffEmail') {
//         email_subject = newAffEmailSubject;
//         email_text = newAffEmailText;
//         email_html = newAffEmail;
//     } else {
//         return 'Not a valid message';
//     }
//     // create reusable transporter object using the default SMTP transport
//     let transporter = nodemailer.createTransport({
//         host: "websultanate.com",
//         port: 587,
//         secure: false,
//         auth: {
//           user: 'jivan@websultanate.com',
//           pass: 'Welcome@123',
//         },
//         tls: {
//             rejectUnauthorized: false,
//           },
//           debug: true,

//     });

//     // send mail with defined transport object
//     let info = await transporter.sendMail({
//       from: '"Scrooge 🎩" <notifications@scrooge.team>', // sender address
//       to: email_address, // list of receivers
//       subject: email_subject, // Subject line
//       text: email_text, // plain text body
//       html: email_html
//     });

//     console.log("Message sent: %s", email_address);
//     return info.messageId;
//   }

//   const newAffEmailSubject = "Congrats! You're in! 🥳🤑";
//   const newAffEmailText = "Congratulations. You are now a Scrooge Affiliate! Visit https://market.scrooge.casino to view your affiliate account.";
//   const newAffEmail = `<html><body style="background-color: #000; font-family: Arial;">
//         <div style="width: 660px; margin: 0 auto; color: #fff; font-family: Poppins; font-size: 20px; text-align: center;">
//                 <img style="margin: 0 auto;" src="https://casino-nft-marketplace.s3.amazonaws.com/affEmailHeader.png" alt="Welcome to the Scrooge Casino Affiliate Program" />
//             <div style="margin: 50px 0; text-align: center; font-size: 24px;">
//                 Congrats and welcome to the<br>Scrooge Casino affiliate program!
//             </div>
//             <div style="margin: 50px 0; text-align: center; font-size: 20px;">
//                 <strong>EARN FREE TOKENS 🤑 every time a friend:</strong><br>👉 Signs up to play at Scrooge Casino<br>👉 Makes a purchase in the Scrooge NFT Marketplace<br>
//             </div>
//             <div style="text-align: center">
//                 <a href="https://Market.Scrooge.Casino/earn-tokens" alt="Sign up for free at Scrooge Casino">
//                     <button style="padding: 15px 30px; font-weight: bold; background-color: #ffd600; font-family: Poppins; font-size: 20px; border-radius: 5px; cursor: pointer;">GO TO YOUR DASHBOARD</button>
//                 </a>
//             </div>
//             <div style="text-align: center; margin-top: 50px; color: #ffd600; font-size: 16px;">
//                 Or paste this link into your browser:<br>
//                 <a href="https://Market.Scrooge.Casino/earn-tokens" alt="Sign up for free at Scrooge Casino" style="color: #ffd600;">https://Market.Scrooge.Casino/earn-tokens</a>
//             </div>
//             <div style="margin: 75px auto 20px auto; text-align: center; font-size: 12px;">
//                 <img src="https://casino-nft-marketplace.s3.amazonaws.com/scroogeHatPrize.png" width="100px" alt="Scrooge Casino, Scrooge LLC" /><br>
//                 Scrooge LLC<br>
//                 805 S Black St<br>
//                 Alexandria, IN 46001<br>
//             </div>
//         </div>
//     </body>
// </html>`;

// const merchEmailSubject = "You've got merch! 🥳🥳";
// const merchEmailText = `Congrats on redeeming your tickets for a merch prize! Your merch code to use at checkout is: merch_coupon_code`;
// const merchEmail = `<html>
//     <head>
//         <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Poppins">
//     </head>
//     <body style="background-color: #000;">
//         <div style="width: 660px; margin: 0 auto; color: #fff; font-family: Poppins; font-size: 20px; text-align: center;">
//                 <a href="https://scroogejunior.com/shop" alt="shop for Scrooge merch" target="_blank"><img style="margin: 0 auto;" src="https://casino-nft-marketplace.s3.amazonaws.com/merchEmailHeader1.jpg" alt="Welcome to the Scrooge Casino Affiliate Program" /></a>
//             <div style="margin: 50px 0; text-align: center; font-size: 24px;">
//                 Congrats!<br>You are going to look amazing in your Scrooge merch.
//             </div>
//             <div style="margin: 50px 0; text-align: center; font-size: 20px;">
//                 Here is your merch redemption code to use at checkout:
//             </div>
//             <div style="margin: 50px 0; text-align: center; font-size: 20px; background-color: #D2042D; padding: 15px;">
//                 <strong>merch_coupon_code</strong>
//             </div>
//             <div style="margin: 50px 0; text-align: center; font-size: 20px;">
//                 You can also keep track of your merch redemption codes within your Scrooge Marketplace wallet.
//             </div>
//             <div style="text-align: center">
//                 <a href="https://Market.Scrooge.Casino/my-wallet" alt="Sign up for free at Scrooge Casino">
//                     <button style="padding: 15px 30px; font-weight: bold; background-color: #ffd600; font-family: Poppins; font-size: 20px; border-radius: 5px; cursor: pointer;">GO TO YOUR WALLET</button>
//                 </a>
//             </div>
//             <div style="text-align: center; margin-top: 50px; color: #ffd600; font-size: 16px;">
//                 Or paste this link into your browser:<br>
//                 <a href="https://Market.Scrooge.Casino/my-wallet" alt="Go to your Scrooge Marketplace wallet" style="color: #ffd600;">https://Market.Scrooge.Casino/my-wallet</a>
//             </div>
//             <div style="margin: 75px auto 20px auto; text-align: center; font-size: 12px;">
//                 <img src="https://casino-nft-marketplace.s3.amazonaws.com/scroogeHatPrize.png" width="100px" alt="Scrooge Casino, Scrooge LLC" /><br>
//                 Scrooge LLC<br>
//                 805 S Black St<br>
//                 Alexandria, IN 46001<br>
//             </div>
//         </div>
//     </body>
// </html>`;

//   //main().catch(console.error);
