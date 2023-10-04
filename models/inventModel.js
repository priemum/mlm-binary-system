const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var inventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    buy: {
      type: Number,
      required: true,
    },
    sell: {
      type: Number,
      required: true,
    },
    tbuy: {
      type: Number,
      required: true,
    },
    tsell: {
      type: Number,
      required: true,
    },
    
    quantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Invent", inventSchema);
