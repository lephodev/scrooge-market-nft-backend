import mongoose from 'mongoose';

const { Schema } = mongoose;

// creating mongo database schema
const itemSchema = new Schema(
  {
    contract: { type: String }, 
    token_id: { type: Number },
    chip_value: { type: Number },
    chain: { type: String }, 
    price: { type: Number },
    name: { type: String }, 
    stripe_prod_id: { type: String },
    type:{ type: String },
    insert_date:{type: Date, default: new Date()},
    payment_link:{ type: String },
    image_url:{type: String }
  },
  { timestamps: true }
);

const itemModel = mongoose.model('item', itemSchema);

export default itemModel;
