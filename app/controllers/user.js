const User = require("../models/user");
const Verification = require("../models/verification");
const validMongoId = require("../services/validateMongoId");
const userSchema = require("../views/user");
const generateOtp = require("../services/otpGenerator");
const { generateHash, compareHash } = require("../services/password");
const sendOtp = require("../services/mailer");
let { generateToken, verifyToken } = require("../services/jwtToken");
let sendMobileOtp=require('../services/fast2sms').default

const userControllers = {};

// SIGNUP API

userControllers.signUp = async (req, res) => {
  try {
    const { error } = userSchema.registerationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Invalid Credentials " });
    }
    const { username, email, mobile, password } = req.body;
    let existingUser = await User.findOne({$or:[ {email: email} ,{mobile:mobile}] });
    if (existingUser) {
      res
        .status(400)
        .json({ message: "An account with provided email already exists" });
    }
    let user = await User.create({
      username,
      email,
      mobile,
      password: generateHash(password),
    });
    if (!user) {
      res.status(400).json({ message: "User can't be created" });
    }
    return res.status(200).json(user);
  } catch (err) {
    throw new Error(err.message);
  }
};

userControllers.sendEmailOtp = async (req, res) => {
  try {
    console.log(req.body);
    const { userId, email } = req.body; // Assuming you have user info in the request
    if (!validMongoId(userId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const emailOtp = generateOtp(6);
    // console.log(emailOtp);
    const otpExpiryDate = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes
    const verify = await Verification.create({
      userId: userId,
      type: "email",
      otp: emailOtp,
      expiresAt: otpExpiryDate,
    });
    // console.log(verify);
    let message = await sendOtp(emailOtp, email);
    console.log("this is message", message);
    if (message) {
      res.status(200).json({success:true,message:"Email OTP Sent successfully"});
      // res.send("Hello");
    } else {
      res.status(400).json({ message: `Email can't be send` });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "An error occurred while sending the OTP",
    error:err});
  }
};

userControllers.login = async (req, res) => {
  try {
   let user ;
    let { error } = req.body;
    if (error) {
      res.status(400).json({ message: "Invalid Credentials " });
    }
    const { field, password } = req.body; // field can have email or username
    console.log(field);
    console.log(field.includes('@'))
    if(field.includes('@')){
      user = await User.findOne({ email: field, emailVerified: true });
      console.log(user);
    }else{
      user = await User.findOne({ username: field, emailVerified: true });
       }
    if (!user) {
      return res.status(404).json({ message: "No user with given Email Id exists" });
    }
    console.log("working")
    let hashedPassword = user?.password;
    if (!compareHash(password, hashedPassword)) {
      res.status(400).json({ message: "Incorrect Password" });
    }
    let token = generateToken(user?._id, user?.email);
    return res
      .status(200)
      .json({
        userId: user?._id,
        username: user?.username,
        message: "User Loged in Succesfully",
        token: token,
      });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// userControllers.forgetPasswor = async(req,res)=>{
//   try{
// let{error}=userSchema.forgetPass.validate(req.body);
// if(error){
//   return res.status(400).json({message:"Invalid Email Id"})
// }
// const{email}=req.body;
// let user = await User.findOne({email:email});
// if(!user){
//   return res.status(400).json({message:"No user exists with given email"})
// }
// // const emailOtp = generateOtp(6);
// // // console.log(emailOtp);
// // const otpExpiryDate = new Date(Date.now() + 2* 60 * 1000); // OTP expires in 5 minutes
// // const verify = await Verification.create({
// //   userId: user?._id,
// //   type: "email",
// //   otp: emailOtp,
// //   expiresAt: otpExpiryDate,
// // });
// // // console.log(verify);
// // let message = await sendOtp(emailOtp, email);
// // if(message){

// // }


//   }catch(err){
// throw new Error(err)
//   }
// }

userControllers.verifyEmailOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const verification = await Verification.findOne({
      userId,
      otp,
      type: "email",
      expiresAt: { $gt: new Date() },
    });
    console.log(verification);
    if (verification) {
      // Update the user's emailVerified field to true
      let doc = await User.findByIdAndUpdate(
        userId,
        { emailVerified: true },
        { new: true }
      );
      console.log(doc, "thisis doc");
      // Delete the verification entry
      let deleted = await Verification.deleteMany({ userId });
      console.log(deleted, "this is deleted");

      res.status(200).json({ message: "Email verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid OTP or OTP expired" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "An error occurred while verifying the OTP" });
  }
};


userControllers.sendPhoneOtp = async (req, res) => {
  console.log(req.body,"req body");
  try {
    const { userId,mobile } = req.body; // Assuming you have user info in the request
    if (!validMongoId(userId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const phoneOtp = generateOtp(4);
    console.log(phoneOtp,"this is phone otp");
    let res = await sendMobileOtp(phoneOtp,mobile)
    console.log(res,"this is res");
    if(!res){
      return res.status(400).json({ message: "Unable to send mobile otp" });

    }
    return res.status(200).json({message:"Otp sent to phone number"});
  } catch (err) {
    res
      .status(500)
      .json({ message: "An error occurred while sending the OTP",
    error:err});
  }
};


module.exports = userControllers;
