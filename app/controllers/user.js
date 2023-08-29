"use strict"

const User = require("../models/user");
const Verification = require("../models/verification");
const validMongoId = require("../services/validateMongoId");
const userSchema = require("../views/user");
const generateOtp = require("../services/otpGenerator");
const { generateHash, compareHash } = require("../services/password");
const sendOtp = require("../services/mailer");
let { generateToken, verifyToken } = require("../services/jwtToken");
let sendMobileOtp = require("../services/twilioOtp").default;

const userControllers = {};

//<---------------AUTH RELATED CONTROLLERS--------------------->

// SIGNUP API ------------------------------------------------------->

userControllers.signUp = async (req, res) => {
  try {
    const { error } = userSchema.registerationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Invalid Credentials ", status: "400" });
    }
    const { username, email, mobile, password, mobileDialCode } = req.body;
    // handled all the cases in case if user closes tab during singup or something uncertain happen
    let existingUser = await User.findOne({
      $or: [{ email: email }, { mobile: mobile }],
    });
    if (existingUser?.emailVerified===false) {
    return  res.status(400).json({
        message: "Verify Your Email",
        status: "400",
      });
    }
    if (existingUser?.phoneVerified===false) {
   return res.status(400).json({
        message: "Verify Your Phone Number",
        status: "400",
      });
    }
    if (existingUser?.phoneVerified===true&&existingUser?.emailVerified===true) {
    return res.status(400).json({
        // here we can also show the login page drectly
        message: "An account with provided credentials already exists -- Move to Login Page--",
        status: "400",
      });
    }
    let user = await User.create({
      username,
      email,
      mobile,
      password: generateHash(password),
      mobileDialCode,
    });
    if (!user) {
      res.status(400).json({ message: "User can't be created", status: "400" });
    }
    return res
      .status(200)
      .json({ status: "200", message: "User created successfullyu", user });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred while sending the OTP",
      error: err.message,
      status: "500",
    });
  }
};

// LOGIN API ---------------------------------------------------------------------------------->
userControllers.login = async (req, res) => {
  try {
    let user;
    let { error } = req.body;
    if (error) {
      res.status(400).json({ message: "Invalid Credentials ", status: "400" });
    }
    const { field, password } = req.body; // field can have email or username
    if (field.includes("@")) {
      user = await User.findOne({ email: field, emailVerified: true });
      console.log(user);
    } else {
      user = await User.findOne({ username: field, emailVerified: true });
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: "No user with given Email Id exists", status: "404" });
    }
    let hashedPassword = user?.password;
    if (!compareHash(password, hashedPassword)) {
      res.status(400).json({ message: "Incorrect Password", status: "400" });
    }else{
      let token = generateToken(user?._id, user?.email);
      return res.status(200).json({
        userId: user?._id,
        username: user?.username,
        message: "User Loged in Succesfully",
        token: token,
        status: "200",
      });

    }
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", status: "500" });
  }
};

// CHANGE PASSWORD/UPDATE PASSWORD API -------------------------------------------------------------->
userControllers.changePassword = async (req, res) => {
  try {
    let { error } = userSchema.passwordSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: `Invalid Body`, error: error.message, status: "400" });
    }
    let { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "The provided password Doesn't match",
        status: "400",
      });
    }
    let userOldPassHash = await User.findById(req.user?.id);
    if (!compareHash(oldPassword, userOldPassHash?.password)) {
      return res
        .status(400)
        .message({ message: "Old password doesn't match", status: "400" });
    }
    let newPasswordHash = generateHash(newPassword);
    if (newPasswordHash) {
      let updatedUser = await User.findByIdAndUpdate(
        req.user?.id,
        { password: newPasswordHash },
        { new: true }
      );

      if (!updatedUser) {
        return res
          .status(400)
          .json({ message: "unable to update Password", status: "400" });
      }
      return res
        .status(200)
        .json({ message: "Password Updated Successfuly", status: "200" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err, status: "500" });
  }
};

// FORGOT PASSWORD API -------------------------------------------------------->
userControllers.forgetPassword = async (req, res) => {
  try {
    let { error } = userSchema.forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Wrong Email", status: "400" });
    }
    let { email } = req.body;
    let existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "NO Account With given Email", status: "400" });
    }
    return res.status(200).json({
      status: 200,
      message: "User Fetched Move to Email Verification",
      email,
    }); // gona add res.redirect
  } catch (err) {
    //userId:existingUser?._id
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err, status: "500" });
  }
};
// RESET PASSWORD API ----------------------------------------------------------------------------->
userControllers.resetPassword = async (req, res) => {
  // gona check by email verification status by otp later if otp verified status true only then user can reset pass
  try {
    let { error } = userSchema.resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Invalid Data", status: "400" });
    }
    let { email, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New and Confirm Password Doesn't Match",
        status: "400",
      });
    }
    let newPasswordHash = generateHash(newPassword);
    let updatedUser = await User.updateOne(
      { email },
      { $set: { password: newPasswordHash } },
      { new: true }
    );
    if (!updatedUser) {
      return res
        .status(400)
        .json({ message: "Unable to update Password", status: "400" });
    }
    return res.status(200).json({
      user: updatedUser,
      message: "Password Updated Successfuly",
      status: "200",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err, status: "500" });
  }
};

//<---------------OTP RELATED CONTROLLERS--------------------->

// SEND EMAIL OTP API ---------------------------------------------------------------------------->
userControllers.sendEmailOtp = async (req, res) => {
  try {
    // console.log(req.body);
    const { userId, email } = req.body;
    if (!validMongoId(userId)) {
      return res.status(400).json({ message: "Invalid Id", status: "400" });
    }
    const emailOtp = generateOtp(4);
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
    // console.log("this is message", message);
    if (message) {
      return res.status(200).json({
        success: true,
        message: "Email OTP Sent successfully",
        status: "200",
        otp: emailOtp,
      });
      // res.send("Hello");
    } else {
      return res
        .status(400)
        .json({ message: "Email can't be send", status: "400" });
    }
  } catch (err) {
    return res.status(500).json({
      message: "An error occurred while sending the OTP",
      error: err,
      status: "500",
    });
  }
};

// VERIFY EMAIL API ------------------------------------------------------->
userControllers.verifyOtp = async (req, res) => {
  try {
    const { userId, otp, type } = req.body;
    const verification = await Verification.findOne({
      userId,
      otp,
      type,
      expiresAt: { $gt: new Date() },
    });
    // console.log(verification);
    if (verification) {
      // Update the user's emailVerified field to true
      let queryobj = {};
      if (type === "phone") {
        queryobj.phoneVerified = true;
      } else if (type === "email") {
        queryobj.emailVerified = true;
      } else {
        return res.status(400).json({ message: "Invalid Type", status: "400" });
      }

      let doc = await User.findByIdAndUpdate(userId, queryobj, { new: true });
      console.log(doc);
      // Delete the verification entry
      await Verification.deleteMany({ userId });
      return res
        .status(200)
        .json({ message: `${type} verified successfully`, status: "200" });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid OTP or OTP expired", status: "400" });
    }
  } catch (err) {
    return res.status(500).json({
      message: "An error occurred while verifying the OTP",
      status: "500",
    });
  }
};

// SEND MOBILE OTP --------------------------------------------------------------------------->
userControllers.sendPhoneOtp = async (req, res) => {
  const accountSid = process.env.TW_ACCOUNT_SID;
  const authToken = process.env.TW_AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);
  try {
    const { userId, mobile, mobileDialCode } = req.body; // Assuming you have user info in the request
    if (!validMongoId(userId)) {
      return res.status(400).json({ message: "Invalid Id", status: "400" });
    }
    const phoneOtp = generateOtp(4);
    let otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000);
    let number = mobileDialCode + mobile;
    console.log(number);
    let twillioresponse = await client.messages.create({
      body: `OTP FOR PHONE NUMBER VERIFICATION IS ${phoneOtp} `,
      from: process.env.TW_PHONE_NUMBER,
      to: number,
    });
    if (twillioresponse.errorCode === null) {
      let otpphoneDoc = await Verification.create({
        userId,
        type: "phone",
        otp: phoneOtp,
        expiresAt: otpExpiryTime,
      });
      return res
        .status(200)
        .json({
          message: "Otp sent successfully on your registered mobile number",
          status: "200",
          otp: phoneOtp,
        });
    } else {
      return res
        .status(400)
        .json({
          message: "Otp can't be sent on your registered mobile number",
          status: "400",
          errorCode: twillioresponse.errorCode,
          errorMessage: twillioresponse.errorMessage,
        });
    }
  } catch (err) {
    res.status(500).json({
      message: "An error occurred while sending the OTP",
      error: err,
      status: "500",
    });
  }
};

module.exports = userControllers;
