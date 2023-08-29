"use strict"

const express = require('express')
const router = express.Router();
const userControllers= require('../controllers/user');
const {authMiddleware,isAdmin}= require('../middlewares/auth')


//<---------------AUTH RELATED ROUTESSSSSS--------------------->

router.post('/register',userControllers.signUp);
router.post('/login',userControllers.login);
router.post('/updatePassword',authMiddleware,userControllers.changePassword)
router.post('/forgetPassword',userControllers.forgetPassword)
router.post('/resetPassword',userControllers.resetPassword)


//<---------------OTP/VERIFICATION RELATED ROUTESSSSSS--------------------->

router.post('/emailOtp',userControllers.sendEmailOtp);
router.post('/verifyOtp',userControllers.verifyOtp);
router.post('/mobileOtp',userControllers.sendPhoneOtp);
module.exports = router;