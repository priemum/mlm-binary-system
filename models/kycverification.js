const mongoose = require("mongoose");


var kycverification = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
    },
    AadharID: {
        type: Number,
        required: true,
        unique: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("Kyc", kycverification);
