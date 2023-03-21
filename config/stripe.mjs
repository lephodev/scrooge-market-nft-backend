import Stripe from 'stripe';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import * as db from './mongodb.mjs';
import affAddOrder from './affiliate.mjs';
import { addChips } from './rewards.mjs';
import * as useSDK from './sdk.mjs';
const envconfig = dotenv.config();
// This is your test secret API key.
const stripe = Stripe(process.env.STRIPE_API_TEST_KEY);

/* Stripe Webhooks */
export async function processStripeWebhook(request) {
    console.log("Webhook Calleddddd");
    let event = request.body;
    // let id="63b436f12ff492a21d19cca9"
    // const query = await db.get_marketplace_itemsDB().findOne({_id : ObjectId(id)})
    // console.log("query",query);
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    /*if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }*/
  
    // Handle the event
    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        console.log(`---------Charge for $${chargeSucceeded.amount.toLocaleString("en-US", {style:"currency", currency:"USD"})} was processed successfully through Stripe!------`);
        // Then define and call a method to handle the successful charge.
        /*const event_id = event.id;
        const charge_id = chargeSucceeded.id;
        const amount = chargeSucceeded.amount;
        const status = chargeSucceeded.status;
        const emailaddress = chargeSucceeded.billing_details.email;
        const name = chargeSucceeded.billing_details.name;
        const paid = chargeSucceeded.paid;
        //const pid = chargeSucceeded.metadata.pid;
        console.log(`---------event_id: ${event_id}---------`);
        console.log(`---------charge_id: ${charge_id}---------`);
        console.log(`---------amount: ${amount}---------`);
        console.log(`---------status: ${status}---------`);
        console.log(`---------emailaddress: ${emailaddress}---------`);
        console.log(`---------name: ${name}---------`);
        console.log(`---------paid: ${paid}---------`);
        console.log('chip_count: ',chargeSucceeded);
        console.log(`---------pid: ${pid}---------`);
        client.connect(async err => {
            const collection = client.db("casino-nft-marketplace").collection("items");
            const query = await collection.findOne({"token_id" : parseInt(token_id)}).then(async (item)=>{
                const chipsAdded = await addChips(user_id, parseInt(item.chip_value), address).then(()=>{
                    console.log("after send");
                    res.send(item.chip_value.toString());
                    client.close();
                });
            });
        }); 
        */
        break;
      case 'checkout.session.completed':
        console.log(`---------checkout.session.completed--------`,event )
        console.log(`-----------------`,event.data )
        console.log(`-----------------122222`,event.data.object )
        const checkoutComplete = event.data.object;
        console.log(`checkoutComplete`,checkoutComplete )
        const item_id = checkoutComplete.metadata.item_id;
        console.log(`item_id`,item_id )

        const userArray = checkoutComplete.client_reference_id;
        const address = userArray.split("_")[0];
        const user_id = userArray.split("_")[1];
        const aff_id = userArray.split("_")[2];
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        if(address && item_id){
                let isError;
                try{
                    const query = await db.get_marketplace_itemsDB().findOne({_id : ObjectId(item_id)}).then(async (item)=>{
                        if(!item){
                            console.log("Item ID not found.");
                            isError = true;
                        } else {
                            //console.log("Item Purchased: ", item.name);
                            //console.log("Chip Qty: ", parseInt(item.chip_value));
                            isError = false;
                            try {
                                const chipsAdded = await addChips(user_id, parseInt(item.chip_value), address).then((trans)=>{
                                    console.log(item.chip_value,"<------Chips sent to user.");
                                    //client.close();
                                    if(aff_id){
                                        console.log("affAddOrder success");
                                        affAddOrder(aff_id, trans.toString(), item.chip_value, item._id.toString(), user_id, address);
                                    };
                                });
                                const NFTTransferred = await useSDK.transferNFT(user_id, item.token_id, address).then(async ()=>{
                                    console.log(item.name,"------NFT transferred to user.");
                                });
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    });
                } catch (error) {
                    console.log("error: ", error);
                    isError = true;
                }
                if(isError){
                    console.log("Invalid data. Cannot complete process.");
                } else {
                    console.log("#### Process Completed Successfully ####");
                }
        } else {
            console.log("Invalid data. Cannot complete process.");
        }
        break;
    case 'payment_method.attached':
        break;
    case 'customer.created':
        break;
    case 'payment_intent.succeeded':
        break;
    case 'payment_intent.created':
        break;
      default:
        // Unexpected event type
        //console.log(`Unhandled event type ${event.type}.`);
    }
    return true;
    // Return a 200 response to acknowledge receipt of the event
    //response.send();
  };
/*End Stripe Webhooks*/





export default stripe;