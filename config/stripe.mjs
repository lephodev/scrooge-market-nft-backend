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

export async function processStripeCheckOut(req, res){
    
    
   
console.log("request",req.body);
const { asset : { name, description, image },buyoutCurrencyValuePerToken: { displayValue}, address, userId,id, affID } = req.body
const balanceRaw = await useSDK.contractCasinoNFT.balanceOf(
    useSDK.sdk_casino_nfts_wallet,
    id
  );
  console.log("balanceRawJivan",balanceRaw);
  const balance = parseInt(balanceRaw);

console.log("getProduct",balance);
if(10>0){
const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            description,
            images: [image]
          },
          unit_amount: parseFloat(displayValue) * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${process.env.SERVER}/webhook/stripe?session_id={CHECKOUT_SESSION_ID}&method=${"card"}&userId=${userId}&address=${address} &token_id=${id}&aff_id=${affID}`,
    cancel_url: `${process.env.CLIENT}?success=fail`
  })

//   console.log("session",session);

   res.send({ code: 200, id: session.id })
}
else {
    res.send({ code: 400, msg: "balance Unacceptable" }) 
}
}

/* Stripe Webhooks */
export async function processStripeWebhook(request,response) {
    console.log("Webhook Calleddddd",request.body);
    const {query:{address,userId,token_id,aff_id},params,body}= request
    let getProduct=await db.get_marketplace_itemsDB().findOne({token_id :parseInt(token_id)})
    console.log("getProduct",getProduct);
const {_id:item_id,chip_value,name}=getProduct
    console.log("item_id",item_id.toString());
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
                        const chipsAdded = await addChips(userId, parseInt(chip_value), address).then((trans)=>{
                            // console.log(item.chip_value,"<------Chips sent to user.");
                            //client.close();
                            if(aff_id){
                                // console.log("affAddOrder success");
                                affAddOrder(aff_id, trans.toString(), chip_value, item._id.toString(), userId, address);
                            };
                        });
                        const NFTTransferred = await useSDK.transferNFT(userId, token_id, address).then(async (res)=>{
                            console.log(name,"------NFT transferred to user.",res);
                            //  response.send({ code: 200, msg: res })
                            if(res!=="Balance Unacceptable"){
                            response.redirect(`${process.env.CLIENT}?success=true`)
                            }else {
                              response.send({ code: 400, msg: res })
                            }

                         });
                        // console.log("NFTTransferred",NFTTransferred);

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
  };
/*End Stripe Webhooks*/





export default stripe;