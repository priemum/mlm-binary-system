const mongoose = require("mongoose"); // Erase if already required

var orderSchema = new mongoose.Schema(
  {
    products: [
      {
        name: String,
        count: Number,
        price: Number,
      },
    ],
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
    },
    country: {
      type: String,
    },
    street: {
      type: String,
    },
    colony: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zip: {
      type: Number,
    },
    mobile: {
      type: Number,
    },
    email: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
