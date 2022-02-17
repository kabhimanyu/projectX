const User = require('@models/auth/user.model');
const httpStatus = require('http-status');
const { omit } = require('lodash');
const otpService = require("@services/otp.services")
const APIError = require('@utils/APIError');

exports.register = async (req, res, next) => {
  try {
    let { fcmId, countryCode, number, firstName,lastName ,email, gender="MALE",platformType="ANDROID",referBy,dob } = req.body 
    mobileDeviceInfo = { fcmId,platformType };
    let mobile = {
      countryCode,
      number
    }
    let { otp } = req.locals
    let referralCode = await otpService.generate(6,{digits:false,alphabets:false,upperCase:true,specialChars:false})
    let _user = await User.getByMobile(mobile)
    if (!_user) {
      _user = await User.create({ email, mobileDeviceInfo, fcmId, mobile, firstName, lastName ,referralCode,gender,dob })
      const { user, accessToken } = await User.findAndGenerateToken({ mobile: _user.mobile })
      res.status(httpStatus.CREATED).json({
        message: "OK",
        user,
        accessToken,
        existing: false,
        otp
      });
    } else {
      _user.mobileDeviceInfo = mobileDeviceInfo
      _user.mobile = mobile
      if(fcmId){
        _user.mobileDeviceInfo.fcmId = fcmId;
      }
      await _user.save()
      const { user, accessToken } = await User.findAndGenerateToken({ mobile: _user.mobile })
      res.status(httpStatus.OK).json({
        message: "OK",
        user,
        accessToken,
        existing: true,
        otp
      });
    }
  } catch (error) {
    return next(new APIError(error));
  }
};