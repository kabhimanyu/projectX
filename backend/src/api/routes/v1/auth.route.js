const express = require('express');
const controller = require('@controllers/auth.controller');
const otpService = require("@services/otp.services")
const { authorize } = require('@middlewares/auth');

const router = express.Router();

router.route('/register')
  .post(otpService.sendOtp,controller.register);
  
module.exports = router;
