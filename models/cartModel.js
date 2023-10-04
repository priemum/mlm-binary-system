const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var cartSchema = new mongoose.Schema(
  {
    products: [
      {
        name: String,
        count: Number,
        price: Number,
        total: Number,
      },
    ],
    userid: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", cartSchema);
