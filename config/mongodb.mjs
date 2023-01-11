import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = "mongodb+srv://nftmarketplace:3nxZXMBvTZ1nxjkX@cluster0.jzruaup.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
/*const token_id = '0';
client.connect(err => {
    const collection = client.db("casino-nft-marketplace").collection("items");
    const query = collection.findOne({"token_id" : parseInt(token_id)}).then((item)=>{
      console.log('Item: ', item);
      //addChips(user_id,item.chip_value,address);
      const chipsAdded = item.chip_value;
      //res.send(item.chip_value.toString());
      // perform actions on the collection object
      //client.close();
    });
});*/

export default client;