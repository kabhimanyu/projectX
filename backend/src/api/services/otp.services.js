const OTP  = require("../models/otp.model.js")
const APIError = require('@utils/APIError');
const httpStatus = require('http-status');

var digits = '0123456789'
var alphabets = 'abcdefghijklmnopqrstuvwxyz'
var upperCase = alphabets.toUpperCase()
var specialChars = '#!&@'
function rand(min, max) {
    var random = Math.random()
    return Math.floor(random * (max - min) + min)
}

exports.generate = (length, options)=>{
    length = length || 10
    var generateOptions = options || {}
    generateOptions.digits = generateOptions.hasOwnProperty('digits') ? options.digits : true
    generateOptions.alphabets = generateOptions.hasOwnProperty('alphabets') ? options.alphabets : false
    generateOptions.upperCase = generateOptions.hasOwnProperty('upperCase') ? options.upperCase : false
    generateOptions.specialChars = generateOptions.hasOwnProperty('specialChars') ? options.specialChars : false
    var allowsChars = ((generateOptions.digits || '') && digits) +
        ((generateOptions.alphabets || '') && alphabets) +
        ((generateOptions.upperCase || '') && upperCase) +
        ((generateOptions.specialChars || '') && specialChars)
    var otp = ''
    for (var index = 0; index < length; ++index) {
        var charIndex = rand(0, allowsChars.length - 1)
        otp += allowsChars[charIndex]
    }
    return otp
}

exports.sendOtp = async (req, res, next) => {
        let otp = await this.generate(4, {})
        let x = {
            mobileNumber: `${req.body.countryCode}${req.body.number}`,
            otp: otp
        }
        OTP.create(x, async(err, data) => {
            if (err) {
                return next(new APIError(err))
            } else {
                req.locals = {otp:data.otp}
                return next()
            }
        })
}

exports.createOtp = async (req, res, next) => {
        let otp = await this.generate(4, {})
        let x = {
            mobileNumber: `${req.body.countryCode}${req.body.number}`,
            otp: otp
        }
        OTP.create(x, async(err, data) => {
            if (err) {
                return next(new APIError(err))
            } else {
              return res.status(httpStatus.CREATED).json(data)
            }
        })
}


exports.verifyOtp = (req, res, next) => {
    var before5min = new Date();
    before5min.setTime(before5min.getTime() - (5 * 60 * 1000));
    console.log(before5min.toLocaleString())

    OTP.findOne({ mobileNumber: `${req.body.countryCode}${req.body.number}`, otp: req.body.otp }, (err, data) => {
        if (err) {
            next(new APIErrorms({message: err.message}))
        } else if (data && data.createdAt < before5min) {
            data.isExpired = true;
            data.save()
            return next(new APIError({message: `otp expired at ${data.createdAt.toLocaleString()}`}))
        }
        else if (data && !data.isUsed) {
            data.isUsed = true;
            data.save()
            return res.status(200).json({ success: true, verify: true, data: data })
        } else {
            return next(new APIError({message:"OTP already used"}))
        }
    })
}