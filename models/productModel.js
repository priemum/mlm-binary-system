const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    
    discout: {
      type: Number,
      default: 0,
    },

    adiscout: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    sold: {
      type: Number,
      default: 0,
    },
   
    image: {
      type: String,
    },

  },
);

//Export the model
module.exports = mongoose.model("Product", productSchema);
