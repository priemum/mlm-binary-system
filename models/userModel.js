const mongoose = require("mongoose"); // Erase if already required

var userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    mobile: {
      type: String,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
      enum: [
        "user",
        "hr",
        "admin",
        "offline"
      ],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: {
      type: Array,
      default: [],
    },
    address: {
      type: String,
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    refreshToken: {
      type: String,
    },
    referralCode: {
      unique: true,
      type: String,
    },
    referredCount: {
      type: Number,
    },
    personReferred: [
      {
        name: String,
      },
    ],
    leftrefferednode: {
      type: String,
    },
    rightreferrednode: {
      type: String,
    },
    totalreferralamountgained: {
      type: Number,
      default: 0,
    },
    virtualcardno: {
      type: String,
      unique: true,
    },
    kycverified: {
      type: String,
      default: "Not verified",
      enum: [
        "Not verified",
        "Processing",
        "verified",
      ],
    },
    walletAmount: {
      type: Number,
      default: 0,
    },
    Aadhar: {
      type: String,
      default: "",
    },
    IFSC: {
      type: String,
      default: "",
    },
    Account: {
      type: String,
      default: "",
    },
    walletcounter: {
      type: Number,
      default: 0,
    },
    ReferralAmountRequested: {
      type: String,
      default: "No",
      enum: [
        "No",
        "Yes",
      ],
    },
    ReferralAmount: {
      type: Number,
      default: 0,
    },
    positiontoadd: {
      type: String,
      default: "left",
      enum: [
        "left",
        "right",
      ],
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
 
);



//Export the model
module.exports = mongoose.model("User", userSchema);
