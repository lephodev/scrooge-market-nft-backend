import SendXRestApi from "send_x_rest_api";
import moment from "moment/moment.js";
import axios from "axios";
const apiKey = process.env.SENDEX_API_KEY; // {String}
const teamId = process.env.SENDEX_TEAM_ID; // {String}
const API_BASE_URL = "https://api.sendx.io/v1";

// export const sendInvoice = async (payload) => {
//   try {

// const {
//   email,
//   username,
//   tokenQuantity,
//   goldCoinQuantity,
//   walletAddress,
//   paymentMethod,
//   purcahsePrice,
//   packageName,
//   Tax,
//   firstName,
//   lastName
// } = payload;

//   // console.log("payloadpayloadpayload",payload);
//   const api = new SendXRestApi.ContactApi();

//   const apiKey = process.env.SENDEX_API_KEY; // {String}

//   const teamId = process.env.SENDEX_TEAM_ID; // {String}
//   let tax=((purcahsePrice)*(Tax)/100);
//   let email1 = email; // String |
//   const trackDetails = new SendXRestApi.TrackRequest(); // TrackRequest | Track Details
//   var callback = function (error, data, response) {
//   if(response.body.status === '200')
//   {
//     let contactDetails = new SendXRestApi.ContactRequest(); // {ContactRequest} Contact details
//     contactDetails.email = email;
//     const callback = function (error, data, response) {
//       if (error) {
//         console.error("errorbnbn",error);
//       } else {
//         let array = data.data.tags;
//         let find = array.find((el) => el === 'Invoice');
//         if (find) {
//           var email2 = email; // String |
//           var trackDetails = new SendXRestApi.TrackRequest(); // TrackRequest | Track Details
//           trackDetails.removeTags = [find];
//           var callback = function (error, data, response) {
//             if (error) {
//               console.error(error);
//             } else {
//               if (data.status == 200) {
//                 contactDetails.customFields = {
// InvoiceDate: moment(new Date()).format('D MMMM  YYYY'),
// PaymentMethod: paymentMethod,
// Price: `${purcahsePrice}`,
// PackageName: packageName,
// GoldCoinQuantity: `${goldCoinQuantity}`,
// TokenQuantity: `${tokenQuantity}`,
// Total: `${purcahsePrice}`,
// SubTotal: `${purcahsePrice}`,
// Tax: `${tax}`,
// GrandTotal: `${purcahsePrice}`,
// WalletAddress: walletAddress,
// UserName:username
//                 };
//                 contactDetails.tags = ['Invoice'];
//                 const callback = function (error, data, response) {
//                   if (error) {
//                     console.error(error);
//                   } else {
//                     // console.log('API called successfully. Returned data3', data.data);
//                   }
//                 };
//                 api.contactIdentifyPost(apiKey, teamId, contactDetails, callback);
//               }
//             }
//           };
//           api.contactTrackPost(apiKey, teamId, email2, trackDetails, callback);
//         } else {
//           contactDetails.customFields = {
//             InvoiceDate: moment(new Date()).format('D MMMM  YYYY'),
//             PaymentMethod: paymentMethod,
//             Price: `${purcahsePrice}`,
//             PackageName: packageName,
//             GoldCoinQuantity: `${goldCoinQuantity}`,
//             TokenQuantity: `${tokenQuantity}`,
//             Total: `${purcahsePrice}`,
//             SubTotal: `${purcahsePrice}`,
//             Tax: `${tax}`,
//             GrandTotal: `${purcahsePrice}`,
//             WalletAddress: walletAddress,
//             UserName:username
//           };
//           contactDetails.tags = ['Invoice'];
//           const callback = function (error, data, response) {
//             if (error) {
//               console.error(error);
//             } else {
//               // console.log('API called successfully. Returned data2', data.data);
//             }
//           };
//           api.contactIdentifyPost(apiKey, teamId, contactDetails, callback);
//         }
//       }
//     };
//     api.contactIdentifyPost(apiKey, teamId, contactDetails, callback);

//   }
//   else
//   {
//     let contactDetails = new SendXRestApi.ContactRequest(); // {ContactRequest} Contact details
//     contactDetails.email = email;
//     contactDetails.firstName=firstName;
//     contactDetails.lastName=lastName;

//     contactDetails.customFields = {
//       InvoiceDate: moment(new Date()).format('D MMMM  YYYY'),
//         PaymentMethod: paymentMethod,
//         Price: `${purcahsePrice}`,
//         PackageName: packageName,
//         GoldCoinQuantity: `${goldCoinQuantity}`,
//         TokenQuantity: `${tokenQuantity}`,
//         Total: `${purcahsePrice}`,
//         SubTotal: `${purcahsePrice}`,
//         Tax: `${tax}`,
//         GrandTotal: `${purcahsePrice}`,
//         WalletAddress: walletAddress,
//         UserName:username
//     };
//     contactDetails.tags = ['Invoice'];
//     const callback = function (error, data, response) {
//       if (error) {
//         console.error(error);
//       } else {
//          console.log('API called successfully. Returned data2', data.data);
//       }
//     };
//     api.contactIdentifyPost(apiKey, teamId, contactDetails, callback);
//   }
//   };
//   api.contactTrackPost(apiKey, teamId, email1, trackDetails, callback);
//   }
// catch (error) {
//     console.log("error",error);
// }
//  };

export const sendInvoice = async (record) => {
  const {
    email,
    username,
    tokenQuantity,
    goldCoinQuantity,
    walletAddress,
    paymentMethod,
    purcahsePrice,
    packageName,
    Tax,
    firstName,
    lastName,
  } = record;

  // console.log("recordrecord", record);

  try {
    let tax = (purcahsePrice * Tax) / 100;
    const response = await axios({
      method: "post",
      url: `https://app.sendx.io/api/v1/contact/identify?team_id=LjzMgKu2tRN5fqYuUgHM9N`,
      headers: {
        "Content-Type": "application/json",
        api_key: apiKey,
      },
      data: {
        email,
        firstName: firstName,
        lastName: lastName,
        email: email,
        tags: ["Invoice"],
        customFields: {
          InvoiceDate: moment(new Date()).format("D MMMM  YYYY"),
          PaymentMethod: paymentMethod,
          Price: `${purcahsePrice}`,
          PackageName: packageName,
          GoldCoinQuantity: `${goldCoinQuantity}`,
          TokenQuantity: `${tokenQuantity}`,
          Total: `${purcahsePrice}`,
          SubTotal: `${purcahsePrice}`,
          Tax: `${tax}`,
          GrandTotal: `${purcahsePrice}`,
          WalletAddress: walletAddress,
          UserName: username,
        },
      },
    });

    // console.log("Contact identified:", response.data.data.email);
    await trackEvent(email);
    return response.data;
  } catch (error) {
    console.error("Error identifying contact:", error.message);
    throw error;
  }
};

async function trackEvent(email) {
  try {
    const response = await axios({
      method: "post",
      url: `https://app.sendx.io/api/v1/contact/track?team_id=LjzMgKu2tRN5fqYuUgHM9N&email=${email}`,
      headers: {
        "Content-Type": "application/json",
        api_key: apiKey,
      },
      data: {
        email,
        addTags: ["Invoice"],
        removeTags: ["Invoice"],
      },
    });

    // console.log("Event tracked:", response.data);
    console.count("Event tracked");
    return response.data;
  } catch (error) {
    console.error("Error tracking event:", error.message);
    throw error;
  }
}
