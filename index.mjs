import express, { json } from 'express';
import db from './config/db.mjs';
import client from './config/mongodb.mjs';
import cors from 'cors';
import Axios from 'axios';
import sdk from './config/sdk.mjs';


const app = express();
const PORT = 9002;
/*app.use(cors(
    {headers : {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"      
    }}
));*/
var corsOptions = {
    
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
      
}
app.use(json());


const contract = await sdk.getContract("0xD831267dDF05156Da33e35EaD05DDBf9ffE1F93E");

function addChips(_user_id, _qty, _address) {
    client.connect(err => {
        const collection = client.db("scrooge").collection("users");
        const query = collection.findOneAndUpdate({"username" : "Brady"},{$inc:{"wallet":_qty}}).then((user)=>{
          //console.log('Mongo User: ', user.value._id);
          const chip_transactions_collection = client.db("casino-nft-marketplace").collection("chip_transactions");
            const queryCT = chip_transactions_collection.insertOne({"user_id" : user.value._id, "address":_address,"chips":_qty,"timestamp":new Date() }).then((trans)=>{
            return true;
          });
        });
    });

    /*let changedRows = 0;
    const foo = db.query("UPDATE users SET chips = chips + ? WHERE id = ?",[_qty, _user_id], (err,result)=>{
       if(err) {
            console.log('error', err);   
        } else if (result.changedRows == 0) {
            console.log('no changed rows');
            return null;
        } else if (result.changedRows == 1) {
            console.log('one row updated');
            const foo = db.query("INSERT INTO chip_transactions (user_id, address, chips) VALUES (?,?,?)",[_user_id,_address,_qty], (err,result)=>{
                console.log("Record added to chip_transactions");
            });
        } else {
            return null;
        }
       changedRows = result.changedRows;
    });
    return changedRows;*/
};

// Route to verify email exists for casino user account
app.get("/api/verifyEmail/:emailaddress", cors(corsOptions), (req,res)=>{
    const emailaddress = req.params.emailaddress;
    client.connect(err => {
        const collection = client.db("scrooge").collection("users");
        const query = collection.findOne({"email" : emailaddress}).then((user)=>{
          res.send(user);
          client.close();
        });
    });
});

// Route to disburse Free Tokens
app.get("/api/getFreeTokens/:address/:token_id/:user_id/:qty", cors(corsOptions), async (req,res)=>{
    const address = req.params.address;
    const token_id = req.params.token_id;
    const user_id = req.params.user_id;
    const qty = req.params.qty;
    if(address && token_id && user_id){
        client.connect(err => {
            const collection = client.db("casino-nft-marketplace").collection("items");
            const query = collection.findOne({"token_id" : parseInt(token_id)}).then((item)=>{
              addChips(user_id,item.chip_value,address);
              res.send(item.chip_value.toString());
              client.close();
            });
        }); 
    } 
});

function addChipsX(_user_id, _qty, _address) {
    let changedRows = 0;
    const foo = db.query("UPDATE users SET chips = chips + ? WHERE id = ?",[_qty, _user_id], (err,result)=>{
       if(err) {
            console.log('error', err);   
        } else if (result.changedRows == 0) {
            console.log('no changed rows');
            return null;
        } else if (result.changedRows == 1) {
            console.log('one row updated');
            const foo = db.query("INSERT INTO chip_transactions (user_id, address, chips) VALUES (?,?,?)",[_user_id,_address,_qty], (err,result)=>{
                console.log("Record added to chip_transactions");
            });
        } else {
            return null;
        }
       changedRows = result.changedRows;
    });
    return changedRows;
};

// Route to redeem Token NFT
app.get("/api/redeemTokenNFT/:address/:token_id/:user_id/:qty", cors(corsOptions), async (req,res)=>{
    const address = req.params.address;
    const token_id = req.params.token_id;
    const user_id = req.params.user_id;
    const qty = req.params.qty;

    if(address && token_id){
        //write sql to get corresponding chip count for token_id
        db.query("SELECT chip_value FROM token_nfts WHERE token_id = ?", token_id, (err,result)=>{
            if(err) {
            console.log(err)
            } else {
                addChips(user_id,result[0].chip_value,address);
                const chipsAdded = result[0].chip_value;
                res.send(chipsAdded.toString());
            }
        });        
    } 
});

// Route to get user's NFT balance
app.get("/api/getWalletNFTBalanceByTokenID/:address/:token_id/:user_id/:qty", cors(corsOptions), async (req,res)=>{
    const address = req.params.address;
    const token_id = req.params.token_id;
    const user_id = req.params.user_id;
    const qty = req.params.qty;
    if(address && token_id){
        const bal = await contract.erc1155.balanceOf(address, token_id);
        console.log('Wallet NFT Balance: ',bal.toString());
        if(bal.toNumber() >= 1){
            addChips(user_id,qty);
            console.log("chips added");
        } else{
            console.log("chips not added. no nft.");
        }
        res.send(bal.toString());
    } 
});

// Route to get available prizes
app.get("/api/getPrizes", cors(corsOptions), (req,res)=>{
    const user_id = req.params.user_id;
    db.query("SELECT * FROM prizes ORDER BY price ASC", (err,result)=>{
        if(err) {
        console.log(err)
        } else {
            //console.log(result);
            res.send(result);
        }
    });
});

// Route to redeem prize
app.get("/api/redeemPrize/:prize_id/:user_id/:qty", cors(corsOptions), async (req,res)=>{
    const prize_id = req.params.prize_id;
    const user_id = req.params.user_id;
    const qty = req.params.qty;

    if(prize_id && user_id){
        db.query("SELECT chips FROM users WHERE id = ?", user_id, (err,result)=>{
            if(err) {
            console.log(err)
            } else {
                const chipBal = result[0].chips;
                db.query("SELECT price FROM prizes WHERE id = ?", prize_id, (err,result)=>{
                    if(err) {
                        console.log(err)
                    } else {
                        const prizeCost = result[0].price;
                        console.log('**** Begin redeem prize process ****')
                        console.log('Prize cost: ', prizeCost);
                        console.log('User chip balance: ', chipBal);
                        if (chipBal >= prizeCost) {
                            const newChipBal = (chipBal-prizeCost);
                            console.log("User has enough chips.");
                            console.log("Debiting spent chips.");
                            db.query("UPDATE users SET chips = chips - ? WHERE id = ?",[prizeCost, user_id], (err,result)=>{
                                if(err) {
                                    console.log(err)
                                } else {
                                    console.log("Chips debited.");
                                    console.log('New chip balance: ', newChipBal);
                                    console.log("Claiming prize.");
                                    //add functionality to disburse prize to user
                                    db.query("INSERT INTO redeem_prize_transactions (user_id, prize_id) VALUES (?,?)",[user_id,prize_id], (err,result)=>{
                                        if(err) {
                                            console.log(err)
                                        } else {
                                            console.log("Redeem transaction recorded.");
                                            res.send(result);
                                        }
                                    });

                                    
                                }
                            });
                        }
                        
                        
                    }
                });
                //addChips(user_id,result[0].chip_value,address);
                //chipsAdded = result[0].chip_value;
                
            }
        });        
    } 
});

// Route to get user's current chip count
app.get("/api/getUserChipCount/:user_id", cors(corsOptions), (req,res)=>{
    const user_id = req.params.user_id;
    db.query("SELECT chips FROM users WHERE id = ?", user_id, (err,result)=>{
        if(err) {
        console.log(err)
        } else {
            res.send(result);
        }
    });
});

// Route to add chips
app.post('/api/addChips/:user_id/:qty', cors(corsOptions),(req,res)=>{

    const user_id = req.params.user_id;
    const qty = req.params.qty;
    db.query("UPDATE chip_transactions SET chips = chips + ? WHERE id = ?",[qty, user_id], (err,result)=>{
        if(err) {
            console.log(err)   
        } else {
            
            res.send(result);
        }
        console.log('why'); 
    });    
});



// Route to get all posts
app.get("/api/get", (req,res)=>{
    query("SELECT * FROM posts", (err,result)=>{
    if(err) {
    console.log(err)
    } 
res.send(result)
});   });

// Route to get one post
app.get("/api/getFromId/:id", (req,res)=>{

const id = req.params.id;
 query("SELECT * FROM posts WHERE id = ?", id, 
 (err,result)=>{
    if(err) {
    console.log(err)
    } 
    res.send(result)
    });   });

// Route for creating the post
app.post('/api/create', (req,res)=> {

const username = req.body.userName;
const title = req.body.title;
const text = req.body.text;

    query("INSERT INTO posts (title, post_text, user_name) VALUES (?,?,?)",[title,text,username], (err,result)=>{
   if(err) {
   console.log(err)
   } 
   console.log(result)
});   });

// Route to like a post
app.post('/api/like/:id',(req,res)=>{

const id = req.params.id;
    query("UPDATE posts SET likes = likes + 1 WHERE id = ?",id, (err,result)=>{
    if(err) {
   console.log(err)   } 
   console.log(result)
    });    
});

// Route to delete a post

app.delete('/api/delete/:id',(req,res)=>{
const id = req.params.id;

    query("DELETE FROM posts WHERE id= ?", id, (err,result)=>{
if(err) {
console.log(err)
        } }); });

app.listen(PORT, ()=>{
    console.log('Server is running on port: ',PORT);
});

