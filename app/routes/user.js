const express = require('express')
const router = express.Router();
const userControllers= require('../controllers/user');
const {authMiddleware,isAdmin}= require('../middlewares/auth')



router.post('/register',userControllers.signUp);
router.post('/sendOtp',userControllers.sendEmailOtp);
router.post('/verifyOtp',userControllers.verifyEmailOtp);
router.post('/login',userControllers.login);
router.post('/resetPassword',authMiddleware.userControllers.changePassword)
router.post('/mobileOtp',userControllers.sendPhoneOtp);

module.exports = router;