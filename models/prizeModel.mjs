import mongoose from 'mongoose';

const { Schema } = mongoose;

// creating mongo database schema
const prizeSchema = new Schema(
  {
    name: { type: String }, 
    description: { type: String }, 
    price: { type: Number },
    image_url:{type: String },
    qty_available:{type: String},
    category:{type:String},
    redeem_action:{type:String},
    contract: { type: String }, 
    token_id: { type: Number },
    token_type:{type:String},
    token_qty: { type: Number },
    contract_name: { type: String }, 
    isDynamic: { type: Boolean },
    insert_date:{type: Date, default: new Date()},
  },
  
  { timestamps: true }
);

const prizeModel = mongoose.model('item', prizeSchema);

export default prizeModel;
