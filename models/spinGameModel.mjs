import mongoose from "mongoose";

const { Schema } = mongoose;

const spinGameSchema = new Schema(
  {
    clientSeed: {
      type: String,
    },
    serverSeed: {
      type: String,
    },
    nonce: {
      type: Number,
      default: 0,
    },
    resultIndex: {
      type: Number,
    },
    rouletteItems: {
      type: Array,
    },
    containerLength: {
      type: Number,
    },
    winItem: {
      type: Object,
    },
  },
  { timestamps: true }
);
const spinGameModel = mongoose.model("spinGame", spinGameSchema);

export default spinGameModel;
