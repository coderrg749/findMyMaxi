const express = require('express')
const router = express.Router();
const userControllers= require('../controllers/user');



router.post('/register',userControllers.signUp);
router.post('/sendOtp',userControllers.sendEmailOtp);
router.post('/verifyOtp',userControllers.verifyEmailOtp);
router.post('/login',userControllers.login);

router.post('/mobileOtp',userControllers.sendPhoneOtp);

module.exports = router;