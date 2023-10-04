const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const PORT = 3000;
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const helmet = require('helmet');
const User = require("./models/userModel");
const kycverification = require('./models/kycverification');
const PCategory = require("./models/prodcategoryModel");
const Product = require("./models/productModel");
const Invent = require("./models/inventModel");
const Order = require("./models/orderModel");
const Cart = require("./models/cartModel");

dbConnect();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "https: data:"],
        "script-src": ["self", "https: data:"]

      }
    })
  )

//functions
const isAuth = async (req, res, next) => {

    if (await req.cookies.jwt === undefined) {
        res.redirect("/login");
    }
    else {
        const token = await req.cookies.jwt;
        try {
            await jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch (e) {
            console.log(e);
            res.redirect("/login");
        }


    }
}



const generateRandomString = (myLength) => {
    const chars =
        "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
    const randomArray = Array.from(
        { length: myLength },
        (v, k) => chars[Math.floor(Math.random() * chars.length)]
    );
    const randomString = randomArray.join("");
    return randomString;
};
const generatecardno = (n) => {
    {
        // var add = 1, max = 12 - add;
        // if (n > max) {
        //     return generate(max) + generate(n - max);
        // }
        // max = Math.pow(10, n + add);
        // var min = max / 10;
        // var number = Math.floor(Math.random() * (max - min + 1)) + min;
        // return ("" + number).substring(add);
        Math.floor(Math.random() * 10000000000000000);
    }
}


//admin panel

// app.get("/sales",async (req,res)=>{})
// app.get("/orders",async (req,res)=>{})


var addcatfound = 1;
var addcatalertMessage = "";

app.get("/addcategories", isAuth, async (req, res) => {
    res.render("addcat", { found: addcatfound, alertMessage: addcatalertMessage });
    addcatfound = 1;
    addcatalertMessage = ""
});

app.post("/addcategories", async (req, res) => {
    const {
        addcat,
        catimg
    } = req.body;
    PCategory.findOne({ title: addcat }).then(async (foound) => {
        if (!foound) {
            const newdata = new PCategory({
                title: addcat,
                image: catimg
            })
            await newdata.save();
        }
        else {
            addcatfound = 0;
            addcatalertMessage = "Category already exist";
        }
        res.redirect("/addcategories");

    }).catch((e) => {
        console.log(e);
    })
});

var addproductfound = 1;
var addproductalertMessage = "";

app.get("/addproducts", isAuth, async (req, res) => {
    const parray=  await PCategory.find();
    res.render("addproducts", { found: addproductfound, alertMessage: addproductalertMessage,parray:parray });
    addproductfound = 1;
    addproductalertMessage = "";
})

app.get("/login.html",(req,res)=>{

    res.redirect("/login");
})

app.post("/addproducts", async (req, res) => {
    const {
        title,
        description,
        price,
        discout,
        category,
        quantity,
        image,
    } = req.body;
    let a=req.body.price-req.body.discout;
    let b=a/req.body.price;
    let d=b.toFixed(1)
    let c=d*100;
    Product.findOne({ title: title }).then(async (foound) => {
        if (!foound) {
            const newdata = new Product({
                title,
                description,
                price,
                discout,
                adiscout: c,
                category,
                image,
                quantity,
            })
            await newdata.save();
        }
        else {
            addproductfound = 0;
            addproductalertMessage = "Product already exist";
        }
        res.redirect("/addproducts");
    }).catch((e) => {
        console.log(e);
    })
})

//hr panel
app.post("/:id/kyc",async(req,res)=>{
    const aadhar=req.body.Aadhar;
    const Account=req.body.Account;
    const IFSC=req.body.IFSC;
    await User.updateOne({_id: req.params.id},{$set: {Aadhar: aadhar,Account:Account,IFSC:IFSC,kycverified:"Processing" }})
    res.redirect(`/${req.params.id}/index`)
    
})
// 1.kyc request accept or not
var kyccfound = 1;
var kyccalertMessage = "";
app.get("/kycrequests", async (req, res) => {
    const parray1 = await User.find({ kycverified: "Processing" });
    res.render("hr_kycrequest", { parray1: parray1, found: kyccfound, alertMessage: kyccalertMessage });
    kyccfound = 1;
    kyccalertMessage = "";
})
app.post("/:id/kycrequests", async (req, res) => {
    const { id } = req.params;
    const Verify= req.body.Verify;
    if (Verify === "approve") {
        await User.updateOne({_id: req.params.id},{$set: {kycverified:"verified" }})
        kyccfound = 0;
        kyccalertMessage = "User kyc is successfully Verified!";
        res.redirect("/kycrequests");
    }
    else if (Verify === "Decline") {
        await User.updateOne({_id: req.params.id},{$set: {kycverified:"Not verified" }})
        kyccfound = 0;
        kyccalertMessage = "User kyc is Declined";
        res.redirect("/kycrequests");

    }
    else {
        kyccfound = 0;
        kyccalertMessage = "Error in kyc verification";
        res.redirect("/kycrequests");
    }
})
// 2.referral withdraw tau request jaegi
var refwithdrawfound = 1;
var refwithdrawalertMessage = "";
app.get("/withdrawal", async (req, res) => {
    const parray1 = await User.find({ ReferralAmountRequested: "Yes" });
    res.render("hr_withdrawal", { parray1: parray1, found: refwithdrawfound, alertMessage: refwithdrawalertMessage });
    refwithdrawfound = 1;
    refwithdrawalertMessage = "";
})
app.get("/:id/withdrawal1", async (req, res) => {

    await User.updateOne({ _id:req.params.id},{$set: {ReferralAmountRequested: "Yes"}})
   res.redirect(`/${req.params.id}/index`)
})

app.post("/:id/withdrawal", async (req, res) => {
    const { id } = req.params;
    const Verify= req.body.Verify;

    if (Verify === "approve") {
        await User.updateOne({_id: req.params.id},{$set: {ReferralAmount:0,ReferralAmountRequested: "No" }})
        kyccfound = 0;
        kyccalertMessage = "Amount Withdraw was successfull";
        res.redirect("/withdrawal");
    }
    else if (Verify === "Decline") {
        await User.updateOne({_id: req.params.id},{$set: {ReferralAmountRequested: "No" }})
        kyccfound = 0;
        kyccalertMessage = "Amount Withdraw was Rejected";
        res.redirect("/withdrawal");

    }
    else {
        kyccfound = 0;
        kyccalertMessage = "Error in Withdraw";
        res.redirect("/withdrawal");
    }
})
//offline panel
var userfound = 1;
var useralertMessage = "";
app.get("/createuser", isAuth, async (req, res) => {
    res.render("createoffline", { found: userfound, alertMessage: useralertMessage });
    userfound = 1;
    useralertMessage = "";
})

var counttt = 0;
const countt = (node) => {
    if (node == null) {
        return 0;
    }
    counttt++;
    if(node.leftrefferednode != null){
        countt(User.findOne({ email: node.leftrefferednode }));
    }
    if(node.rightreferrednode){
        countt(User.findOne({ email: node.rightreferrednode }));
    }
};


app.post("/createuser", async (req, res) => {
    try {
        const {
        firstName,
        lastName,
        address,
        AadharID,
        walletAmount,
        } = req.body;
        const email1 = req.body.email;
        const referralCode = req.body.Referral;
        const mobile = req.body.mobile;
        const Account = req.body.Account;
        const IFSC = req.body.IFSC;
        const positiontoadd = req.body.Position;
        const email = email1.toLowerCase();
        await User.findOne({ email: email }).then(async (usser) => {
            if (!usser) {
                if (referralCode != "") {
                    let user = await User.findOne({ referralCode: referralCode })
                    if (!user) {
                        rfound = 1;
                        rfound = "Referal code invalid";
                        res.redirect("/register");
                    }
                    else {
                        user.referredCount = user.referredCount + 1;
                        let obj={
                            "name":email
                        }
                        await User.findOneAndUpdate({ userid: user._id},{$push:{personReferred: obj}});
                        if (positiontoadd == "left") {
                            if (user.leftrefferednode == null) {
                                user.leftrefferednode = email;
                            }
                            else {
                                while (user.leftrefferednode != null) {
                                    user = await User.findOne({ email: user.leftrefferednode });
                                }
                                user.leftrefferednode = email;
                            }
                            const refferedby = await User.findOne({ referralCode: referralCode });
                            counttt = 0;
                            await countt(refferedby.leftrefferednode);
                            const leftchilds=counttt;
                            counttt = 0;
                            await countt(refferedby.rightreferrednode);
                            const rightchilds=counttt;
                            counttt = 0;
                            if (leftchilds != 0 && rightchilds != 0) {
                                if (leftchilds === rightchilds) {
                                    const amount_to_distribute = 200 * leftchilds;
                                    const totalreferralamountgained = refferedby.totalreferralamountgained;
                                    const amounttoadd = amount_to_distribute - totalreferralamountgained;
                                    refferedby.ReferralAmount = refferedby.ReferralAmount + amounttoadd;
                                    refferedby.totalreferralamountgained = totalreferralamountgained + amounttoadd;
                                    await refferedby.save();
                                }
                            }
                        }
                        if (positiontoadd == "right") {
                            if (user.rightreferrednode == null) {
                                user.rightreferrednode = email;
                            }
                            else {
                                while (user.rightreferrednode != null) {
                                    user = await User.findOne({ email: user.rightreferrednode });
                                }
                                user.rightreferrednode = email;
                            }
                            const refferedby = await User.findOne({ referralCode: referralCode });
                            counttt = 0;
                            countt(refferedby.leftrefferednode);
                            const leftchilds=counttt;
                            counttt = 0;
                            countt(refferedby.rightreferrednode);
                            const rightchilds=counttt;
                            counttt = 0;
                            console.log(rightchilds);
                            console.log(leftchilds);
                            if (leftchilds != 0 && rightchilds != 0) {
                                if (leftchilds === rightchilds) {
                                    const amount_to_distribute = 200 * leftchilds;
                                    console.log(amount_to_distribute)

                                    const totalreferralamountgained = refferedby.totalreferralamountgained;
                                    console.log(totalreferralamountgained)

                                    const amounttoadd = amount_to_distribute - totalreferralamountgained;
                                    console.log(amounttoadd)
                                    refferedby.ReferralAmount = refferedby.ReferralAmount + amounttoadd;
                                    refferedby.totalreferralamountgained = totalreferralamountgained + amounttoadd;
                                    await refferedby.save();
                                }
                            }
                        }
                        await user.save();
                    }

                }
                let rand=Math.random().toString(16).substr(2);
                let rand1=Math.random().toString(16).substr(2);
                let referralCode1= rand+rand1;
                let virtualcardno= (""+ Math.random()).substring(2,18);

                const hashpassword = await bcrypt.hash(mobile, 10);

                const newuser = new User({
                    firstname:firstName,
                    lastname:lastName,
                    email,
                    password: hashpassword,
                    mobile,
                    address,
                    Account:Account,
                    IFSC:IFSC,
                    referralCode: referralCode1,
                    virtualcardno: virtualcardno,
                    referredCount: 0,
                    kycverified: "verified",
                    walletAmount,
                    Aadhar:AadharID,
                })
                const role = "user";
                const savedUser = await newuser.save();
                res.redirect(`/createuser`);
            }
            else {
                rfound = 1;
                rfound = "User already registered";
                res.redirect("/createuser");
            }
        });

    }
    catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err);
    }
})



var walletfound = 1;
var walletalertMessage = "";

app.get("/walletpay", isAuth, async (req, res) => {
    res.render("cardpayment", { found: walletfound, alertMessage: walletalertMessage });
    walletfound = 1;
    walletalertMessage = "";
})


app.post("/walletpay", async (req, res) => {
    const {
        virtualcardno,
        Amount,
    } = req.body;

    User.findOne({ virtualcardno: virtualcardno }).then(async (foound) => {
        if (!foound) {
            addproductfound = 0;
            addproductalertMessage = "Card Doesn't exist";
        }
        else {
            const user = await User.findOne({ virtualcardno: virtualcardno });
            if (user.walletAmount < Amount) {
                addproductfound = 0;
                addproductalertMessage = "Insufficient Balance";
            }
            else {
                const counter = user.walletcounter;
                if (counter >= 10) {
                    user.walletAmount = user.walletAmount - Amount;
                    await user.save();
                    addproductfound = 0;
                    addproductalertMessage = "Transaction Successfull";
                }
                else {
                    const amounttolock = (10 - counter - 1) * 69.9;
                    const available_amount_to_use = user.walletAmount - amounttolock;
                    if (available_amount_to_use >= Amount) {
                        user.walletAmount = user.walletAmount - Amount;
                        user.walletcounter = user.walletcounter + 1;
                        await user.save();
                        addproductfound = 0;
                        addproductalertMessage = "Transaction Successfull";
                    }
                    else {
                        addproductfound = 0;
                        addproductalertMessage = "Insufficient Balance";
                    }
                }
            }
        }
        res.redirect("/walletpay");

    }).catch((e) => {
        console.log(e);
    })
})
app.get("/",async (req, res) => {
    const parray1 = await PCategory.find({});
    const parray = await Product.find({});
    const parray2 = await Product.find({category: "Highly discounted"});
    res.render("index2", { parray1: parray1,parray:parray,parray2:parray2});
})

var rfound=0;
var rmessage="";
app.get("/register", async (req, res) => {
    res.render("register",{rfound:rfound,rmessage:rmessage});
    rfound=0;
    rmessage=""
})



// user panel
app.post("/register", async (req, res) => {
    try {
        const {
            firstname,
            lastname,
            password,
            mobile,
            address,
            referralCode,
        } = req.body;
        const email1=req.body.email;
        const email=email1.toLowerCase();
        const cardno = generatecardno(16);
        await User.findOne({ email: email }).then(async(user)=>{
                if(!user){
                    if (referralCode != "") {
                        const user = await User.findOne({ referralCode: referralCode })
                        if (!user) {
                            rfound=1;
                            rfound="Referal code invalid";
                            res.redirect("/register");
                        }
                        else{
                            user.referredCount = user.referredCount + 1;
                            user.personReferred = user.personReferred.push(email);
                            await user.save();
                        }
                        
                    }
                    let rand=Math.random().toString(16).substr(2);
                    let rand1=Math.random().toString(16).substr(2);
                    let referralCode1= rand+rand1;
                    let virtualcardno= (""+ Math.random()).substring(2,18);


                    const hashpassword = await bcrypt.hash(password, 10);
                    const newuser = new User({
                        firstname,
                        lastname,
                        email,
                        password: hashpassword,
                        mobile,
                        address,
                        referralCode: referralCode1,
                        virtualcardno: virtualcardno,
                        referredCount: 0,
                    })
                    const role = "user";
                    const savedUser = await newuser.save().then(async () => {
                        const token = await jwt.sign({
                            role
                        }, process.env.JWT_SECRET)
                        res.cookie("jwt", token, {
                            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            httpOnly: true
                        })
                    });
                    const us=await User.findOne({ email: email });
                    const id = us._id;
                    res.redirect(`/${id}/index`);
                    res.status(201).json(savedUser);
                }
                else{
                    rfound=1;
                    rfound="User already registered";
                    res.redirect("/register");
                }
        });
        
    }
    catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err);
    }
})
var loginfound = 1;
var loginalertMessage = "";

app.get("/login", async (req, res) => {
    res.render("login", { found: loginfound, alertMessage: loginalertMessage });
    loginfound = 1;
    loginalertMessage = "";
})
app.post("/login", async (req, res) => {
    let email1=req.body.email;
    let password=req.body.password;
    let email=email1.toLowerCase();
    if (email === "emailtushar1910@gmail.com") {
        if(password== "offline@1234"){
            const role = "offline";
                        const token = jwt.sign({ role }, process.env.JWT_SECRET)
                        res.cookie("jwt", token, {
                            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            httpOnly: true
                        });
            res.redirect("/createuser");

        }
        else{
            loginfound = 0;
            loginalertMessage = "Invalid Credentials";
            res.redirect("/login");
        }
    }else if (email === "guptatushar1909@gmail.com") {
        if(password== "hr@1234"){
            const role = "hr";
                        const token = jwt.sign({ role }, process.env.JWT_SECRET)
                        res.cookie("jwt", token, {
                            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            httpOnly: true
                        });
            res.redirect("/kycrequests");

        }
        else{
            loginfound = 0;
            loginalertMessage = "Invalid Credentials";
            res.redirect("/login");
        }
    } 
    else if (email === "t.guptacool1909@gmail.com") {
        if(password=="Admin@12345"){
            const role = "admin";
                        const token = jwt.sign({ role }, process.env.JWT_SECRET)
                        res.cookie("jwt", token, {
                            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            httpOnly: true
                        });
            res.redirect("/addcategories");
        }
        else{
            loginfound = 0;
            loginalertMessage = "Invalid Credentials";
            res.redirect("/login");
        }
    }
    else {
        try {
            await User.findOne({ email: email }).then(async(user)=>{
                if (!user) {
                    loginfound = 0;
                    loginalertMessage = "User not found";
                    res.redirect("/login");
                }
                else{
                    const ismatch = await bcrypt.compare(password,user.password);
                    if (ismatch) {
                        const role = user.role;
                        const token = await jwt.sign({ role }, process.env.JWT_SECRET)
                        res.cookie("jwt", token, {
                            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            httpOnly: true
                        });
                        
                        const id = user._id;
                        if(role=== "user"){
                            res.redirect(`/${id}/index`);
                        }else if(role === "admin"){
                            res.redirect("/addcategories");
                        }else if(role=="hr"){
                            res.redirect("/kycrequests");
                        }
                        else{
                            res.redirect("/createuser");
                        }
                    }
                    else {
                        loginfound = 0;
                        loginalertMessage = "Invalid Credentials";
                        res.redirect("/login");
                    }
                }
            });  
        } 
        catch (err) {
            res.status(500).json({ error: err.message });
            console.log(err);
        }
    }
   
})

app.get("/:id/virtualcard", isAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (user.kycverified === "Not verified") {
            res.json({ msg: "kyc verification required" });
        }
        else if (user.kycverified === "Processing") {
            res.json({ msg: "kyc Still in processing" })
        }
        else {
            const cardnumber = user.virtualcardno;
            res.json(cardnumber);
        }
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
})
app.post("/:id/kycverification", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (user.kycverified === "Not verified") {
            const newCategory = await kycverification.create(req.body);
            user.kycverified = "Processing";
            res.json(newCategory);
        }
        else if (user.kycverified === "Processing") {
            res.json({ msg: "Still in processing" })
        }
        else {
            res.json({ msg: "Already Verified" })
        }
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
})
app.get(":/id/wallet", isAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (user.kycverified === "Not verified") {
            res.json({ msg: "kyc verification required" });
        }
        else if (user.kycverified === "Processing") {
            res.json({ msg: "Still in processing" })
        }
        else {
            const amount = user.walletAmount;
            res.json(amount);
        }
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
})
app.post(":/id/wallet/addamount", async (req, res) => {
    const { id } = req.params;
    const { Amount_to_add } = req.body;
    const user = await User.findById(id);
    if (user.kycverified === "Not verified") {
        res.json({ msg: "kyc verification required" });
    }
    else if (user.kycverified === "Processing") {
        res.json({ msg: "kyc Still in processing" })
    }
    else {
        if (Amount_to_add < 699) {
            res.json({ msg: "You have to add atleast 699" });
        }
        else {
            user.walletAmount = user.walletAmount + Amount_to_add;
            await user.save();
            res.json({ msg: "amount added successfully" });
        }

    }
})
app.post("/userwalletpay", async (req, res) => {
    const { id } = req.params;
    const {
        Amount,
    } = req.body;
    const user = await User.findById(id);
    if (!user) {
        res.json({ msg: "User not exist" })
    }
    if (user.walletAmount < Amount) {
        res.json({ msg: "Insufficient Balance" })
    }
    else {
        const counter = user.walletcounter;
        if (counter >= 10) {
            user.walletAmount = user.walletAmount - Amount;
            await user.save();
            res.json({ msg: "Transaction Successfull" })
        }
        else {
            const amounttolock = (10 - counter - 1) * 69.9;
            const available_amount_to_use = user.walletAmount - amounttolock;
            if (available_amount_to_use >= Amount) {
                user.walletAmount = user.walletAmount - Amount;
                user.walletcounter = user.walletcounter + 1;
                await user.save();
                res.json({ msg: "Transaction Successfull" })
            }
            else {
                res.json({ msg: "Insufficient Balance" })
            }
        }
    }
})

app.get("/:id/index", isAuth, async (req, res) => {
    const parray1 = await PCategory.find({});
    const parray = await Product.find({});
    const parray2 = await Product.find({category: "Highly discounted"});


    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    res.render("index", { parray1: parray1,parray:parray,parray2:parray2, id: req.params.id, kyc: user.kycverified, wallet: user.walletAmount, cartnum: cartnum });
})
app.get("/:id/kyc", isAuth, async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    res.render("Kyc", { kyc: user.kycverified, wallet: user.walletAmount, cartnum: cartnum, id: req.params.id });
})





app.get("/:id/profile", isAuth, async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    let flag=0;
    if(user.walletcounter > 0 || user.walletAmount>=699){
        flag=1;
    }
    res.render("profile", { kyc: user.kycverified,flag:flag,wallet:user.walletAmount, fname: user.firstname, lname: user.lastname, mobile: user.mobile, email: user.email, referal: user.referralCode, vc: user.virtualcardno, cartnum: cartnum, id: req.params.id,referalamount:user.ReferralAmount });
})
app.post("/:id/profile", async (req, res) => {
    res.redirect(`/${req.params.id}/kyc`);
})

app.get("/:id/shop-grid", isAuth, async (req, res) => {
    const parray = await Product.find();
    const parray1 = await PCategory.find({});

    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    res.render("shop-grid", { parray: parray,parray1:parray1, kyc: user.kycverified, wallet: user.walletAmount, cartnum: cartnum, id: req.params.id });
})

app.get("/:id/:category/shop-grid", isAuth, async (req, res) => {
    const parray = await Product.find({ category: req.params.category });
    const parray1 = await PCategory.find({});

    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    res.render("shop-grid", { parray: parray,parray1:parray1, kyc: user.kycverified, wallet: user.walletAmount, cartnum: cartnum, id: req.params.id });
})



app.get("/shop-grid2", async (req, res) => {
    const parray = await Product.find();
    const parray1 = await PCategory.find({});
    res.render("shop-grid2", { parray: parray,parray1:parray1 });
})

app.get("/:category/shop-grid2", async (req, res) => {
    const parray = await Product.find({ category: req.params.category });
    const parray1 = await PCategory.find({});
    res.render("shop-grid2", { parray: parray,parray1:parray1 });
})
app.get("/:id/:sid/shop-details", isAuth, async (req, res) => {
    const pro = await Product.findOne({ _id: req.params.sid });
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    res.render("shop-details", { productName: pro.title,productImage:pro.image, productPrice: pro.price, productquant: pro.quantity, kyc: user.kycverified, wallet: user.walletAmount, cartnum: cartnum, id: req.params.id, productDescription: pro.description });
})
app.get("/:sid/shop-details2", async (req, res) => {
    const pro = await Product.findOne({ _id: req.params.sid });
    res.render("shop-details2", { productName: pro.title,productImage:pro.image, productPrice: pro.price, productquant: pro.quantity, productDescription: pro.description });
})
app.get("/:id/shoping-cart", isAuth, async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    let cartnum;
    let parray=[];
    total=0;
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
        parray=cart.products;
        for(var i=0;i<cart.products.length;i++){
                total=total+(cart.products[i].count*cart.products[i].price)
        }
     
    }
    res.render("shoping-cart", { kyc: user.kycverified,parray:parray,total:total, wallet: user.walletAmount, cartnum: cartnum, id: req.params.id });
})
app.get("/shoping-cart/:id/:name/delete/", isAuth, async (req, res) => {
    let id = req.params.id
    let name1 = req.params.name

    await Cart.updateOne({userid: req.params.id},{$pull: {products: {name: name1}}});
    res.redirect(`/${id}/shoping-cart`);
})
app.get("/shoping-cart/:id/:name/:quantity/:price/add/", isAuth, async (req, res) => {
    let id = req.params.id;
    let name1 = req.params.name;
    let quantity = req.params.quantity;
    let total= 0;
    let price1 = req.params.price;
    const cart = await Cart.findOne({ userid: req.params.id });
    let flag=0;
    let produ=[];
    if(!cart){
        flag=2;
        produ=[{
            "name": name1,
            "count": quantity,
            "price": price1,
            "total": quantity*price1,
        }];
        const ncart= new Cart({
            products: produ,
            userid: id
        })
        ncart.save();
    }else{
        for(var i=0;i<cart.products.length;i++){
            if(cart.products[i].name==name1){
                flag=1;
                quantity=(cart.products[i].count) +1;
                total= quantity*price1;
                break;
            }
        }
    }
   
    if(flag==1){
        await Cart.updateOne({ userid: req.params.id,"products.name": name1 },{$set:{"products.$.count": quantity,"products.$.total": total}});

    }else if(flag==0){
       let obj={
        "name": name1,
        "count": quantity,
        "price": price1,
        "total": quantity*price1,
       };
       await Cart.findOneAndUpdate({ userid: req.params.id},{$push:{products: obj}});

    }
    res.redirect(`/${id}/shoping-cart`);

})
app.post("/shoping-cart/:id/:name/:price/add/", isAuth, async (req, res) => {
    let id = req.params.id;
    let name1 = req.params.name;
    let quantity = req.body.quantity;
    let total= 0;
    let price1 = req.params.price;
    const cart = await Cart.findOne({ userid: req.params.id });
    let flag=0;
    let produ=[];
    if(!cart){
        flag=2;
        produ=[{
            "name": name1,
            "count": quantity,
            "price": price1,
            "total": quantity*price1,
        }];
        const ncart= new Cart({
            products: produ,
            userid: id
        })
        ncart.save();
    }else{
        for(var i=0;i<cart.products.length;i++){
            if(cart.products[i].name==name1){
                flag=1;
                total= quantity*price1;
                break;
            }
        }
    }
   
    if(flag==1){
        await Cart.updateOne({ userid: req.params.id,"products.name": name1 },{$set:{"products.$.count": quantity,"products.$.total": total}});

    }else if(flag==0){
       let obj={
        "name": name1,
        "count": quantity,
        "price": price1,
        "total": quantity*price1,
       };
       await Cart.findOneAndUpdate({ userid: req.params.id},{$push:{products: obj}});

    }
    res.redirect(`/${id}/shoping-cart`);

})
app.get("/shoping-cart/:id/:name/:quantity/update/", isAuth, async (req, res) => {
    let id = req.params.id
    let name1 = req.params.name
    let quantity = Number(req.params.quantity)
    const cart = await Cart.findOne({ userid: req.params.id });
    let arr=[];
    for(var i=0;i<cart.products.length;i++){
        if(cart.products[i].name==name1){
            if(quantity+cart.products[i].count>=0){
                cart.products[i].count=quantity+cart.products[i].count;
                cart.products[i].total=cart.products[i].price*cart.products[i].count;
            }

        }
    }
    await cart.save();
    res.redirect(`/${id}/shoping-cart`);
})
app.get("/:id/checkout", isAuth, async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        res.redirect(`/${id}/shoping-cart`);
    }else{
        let total=0;
        for(var i=0;i<cart.products.length;i++){
            total=total+(cart.products[i].count*cart.products[i].price)
         }

        res.render("checkout", { kyc: user.kycverified, wallet: user.walletAmount, cartnum: cart.products.length, id: req.params.id, parray: cart.products,total:total });    }
   
})
app.get("/:id/contact", isAuth, async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    res.render("contact", { kyc: user.kycverified, wallet: user.walletAmount, cartnum: cartnum, id: req.params.id });
})
app.get("/contact2", async (req, res) => {
  
    res.render("contact2",{});
})
app.get("/:id/shoping-cart", isAuth, async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }
    res.render("shoping-cart", { kyc: user.kycverified, wallet: user.walletAmount, cartnum: cartnum, id: req.params.id });
})


var privilagefound = 1;
var privilagealertMessage = "";
app.get("/privilage", async (req, res) => {
    res.render("privilage", { found: privilagefound, alertMessage: privilagealertMessage });
    privilagefound = 1;
    privilagealertMessage = "";
})
app.post("/privilage", async (req, res) => {
    const { email, role,password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
        const user1 = new User({
            email,
            password,
            role
        })
        await user1.save();
        privilagefound = 0;
        privilagealertMessage = "User successfully added";
        res.redirect("/privilage");

    }
    else {
        user.role = role;
        await user.save();
        privilagefound = 0;
        privilagealertMessage = "User role changed successfully";
        res.redirect("/privilage");
    }
})

app.post("/:id/checkout", isAuth,async (req, res) => {
    const {
        firstname,
        lastname,
        country,
        street,
        colony,
        city,
        state,
        zip,
        mobile,
        email,
    } = req.body;
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    const id = user._id;
    if (cart.products.length === 0) {
        res.redirect(`/${id}/index`)
    }
    else {
        const neworder = new Order({
            products: cart.products,
            firstname,
            lastname,
            country,
            street,
            colony,
            city,
            state,
            zip,
            mobile,
            email,
        })
        await neworder.save();
        for(var i=0;i<cart.products.length;i++){
            const pro = await Product.findOne({ title: cart.products[i].name});
            var left= (pro.quantity)-(cart.products[i].count);
            pro.quantity=left;
            pro.sold=cart.products[i].count;
            await pro.save();
        }
        await Cart.deleteOne({ userid: req.params.id });
        res.redirect(`/${id}/index`)
    }
})

var pfound=1;
var palertMessage="";
var pcfound=1;
var pcalertMessage="";

app.get("/deleteproducts",async (req,res)=>{
    const parray = await Product.find();
    res.render("dproduct",{found: pfound,alertMessage:palertMessage,parray:parray})
    pfound=1;
    palertMessage="";
})
app.get("/deletecategories",async (req,res)=>{
    const parray = await PCategory.find();
    res.render("dcat",{found: pcfound,alertMessage:pcalertMessage,parray:parray})
    pcalertMessage="";
    pcfound=1;

})
var pufound=1;
var pualertMessage="";
var pucfound=1;
var pucalertMessage="";
app.get("/uproducts",async (req,res)=>{
    const parray = await Product.find();
    res.render("uproduct",{found: pufound,alertMessage:pualertMessage,parray:parray})
    pufound=1;
    pualertMessage="";
})
app.get("/ucategories",async (req,res)=>{
    const parray = await PCategory.find();
    res.render("ucat",{found: pucfound,alertMessage:pucalertMessage,parray:parray})
    pucalertMessage="";
    pucfound=1;

})
app.post("/deletecategories",async (req,res)=>{
    const title=req.body.title;

    await PCategory.deleteOne({ title: title});
    pcalertMessage="Category successfully deleted";
    pcfound=0;
    res.redirect("/deletecategories")

})
app.post("/deleteproducts",async (req,res)=>{
    const title=req.body.title;
    await Product.deleteOne({ title: title});
    pfound=0;
    palertMessage="Product successfully deleted";
    res.redirect("/deleteproducts")

})

app.post("/ucategories",async (req,res)=>{
   
    const pro = await PCategory.findOne({ title: req.body.title});
    pro.image=req.body.catimg;
    await pro.save();
    pucalertMessage="Category successfully updated";
    pucfound=0;
    res.redirect("/ucategories")

})
app.post("/uproducts",async (req,res)=>{
    const {
        title,
        description,
        price,
        discout,
        category,
        quantity,
        image,
    } = req.body;
    let a=req.body.price-req.body.discout;
    let b=a/req.body.price;
    let d=b.toFixed(1)
    let c=d*100;
    const pro = await Product.findOne({ title: req.body.title});
    pro.description=req.body.description;
    pro.discout=req.body.discout;
    pro.price=req.body.price;
    pro.category=req.body.category;
    pro.quantity=req.body.quantity;
    pro.image=req.body.image;
    pro.adiscout=c;
    await pro.save();
    pufound=0;
    pualertMessage="Product successfully updated";
    res.redirect("/uproducts")

})
var ifound=1;
var ialertMessage=""
app.get("/invent",async(req,res)=>{
    res.render("invent",{found: ifound,alertMessage:ialertMessage })
    ifound=1;
    ialertMessage=""
})
app.post("/invent",async(req,res)=>{
    const{
        title,
        buy,
        sell,
        quantity,
        unit
    }= req.body;
    let s=sell*quantity;
    let b=quantity*buy;
    const newdata = new Invent({
        title,
        buy,
        sell,
        tbuy:b,
        tsell:s,
        quantity,
        unit
    })
    await newdata.save();
    ifound=0;
    ialertMessage="Operation performed successfully"
    res.redirect("/invent")
})

app.get("/sales", async (req, res) => {
    const parray = await User.find({});
    let treferal=0;
    for(var i=0;i<parray.length;i++){
        treferal=treferal+parray[i].referredCount;
    }
    const parray1 = await Order.find({});
    let tsale=parray1.length
    parray1.reverse();
    const newarr = parray1.slice(0, 5);
    res.render("sales", { parray1: newarr,tsale:tsale,treferal:treferal });
})

app.get("/orders", async (req, res) => {
    const parray1 = await Order.find({});
    parray1.reverse();
    res.render("orders", { parray1: parray1 });
})
app.get("/list",async(req,res)=>{
    const pro = await Invent.find();

    res.render("list",{parray1:pro})
})

app.get("/list",async(req,res)=>{
    const pro = await Invent.find();

    res.render("list",{parray1:pro})
})
app.get("/user",async(req,res)=>{
    const pro = await User.find({role: "user"});

    res.render("user",{parray1:pro})
})
app.post("/sproduct",async(req,res)=>{
    var title1= req.body.title;
    const parray1 = await PCategory.find({});
    let title=title1;
    const pro = await Product.findOne({ title: title});
    let pro1=[];
    if(!pro){
        pro1=[];
    }else{
        pro1.push(pro);
    }

    res.render("shop-grid2",{parray:pro1,parray1:parray1})
})
app.post("/:id/sproduct",async(req,res)=>{
    var title= req.body.title;
    const parray1 = await PCategory.find({});

    const pro = await Product.findOne({ title: title});
    let pro1=[];
 if(!pro){
        pro1=[];
    }else{
        pro1.push(pro);
    }    
    console.log(parray1.kength);
    console.log(pro1.kength);
    const user = await User.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ userid: req.params.id });
    if(!cart){
        cartnum=0;
    }else{
        cartnum=cart.products.length;
    }

    res.render("shop-grid",{parray:pro1,parray1:parray1,id:req.params.id,cartnum:cartnum,kyc: user.kycverified, wallet: user.walletAmount})
})


app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running  at PORT ${PORT}`);
});
