const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const APIError = require('@utils/APIError');
const { env, jwtSecret, jwtExpirationInterval } = require('@config/vars');
const Schema = mongoose.Schema
const LoginSession = require("@models/auth/login.session")

/**
* User Roles
*/
const roles = ['USER'];
const Genders = ['MALE', 'FEMALE', 'OTHER']
/**
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
  mobile: {
    countryCode: { type: String },
    number: { type: String }
  },
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    trim: true,
    lowercase: true,
  },
  firstName: {
    type: String,
    maxlength: 128,
    trim: true,
  },
  lastName: {
    type: String,
    maxlength: 128,
    trim: true,
  },
  gender: { type: String, enum: Genders },
  dob: { type: Date },
  referralCode: {
    type: String
  },
  referBy:{
    type: String
  },
  mobileDeviceInfo: {
    fcmId: String,
    platformType: {type:String,enum:["ANDROID","IOS"]},
    make: String,
    model: String
  },
  role: {
    type: String,
    enum: roles,
    default: 'USER',
  },
  picture: {
    type: String,
    trim: true,
  },
  location:{
    lat:{ type:Number },
    long:{ type:Number }
  }
}, {
  timestamps: true,
});


userSchema.set('toObject', { virtuals: true })
userSchema.set('toJSON', { virtuals: true })

userSchema.virtual('age').get(function () {
  const dob = new Date(this.dob)
  var today = new Date()
  var age = today.getFullYear() - dob.getFullYear()
  if (today.getMonth() === dob.getMonth() || today.getDate() === dob.getDate() ||
    today.getMonth() < dob.getMonth() || today.getDate() < dob.getDate()) {
    --age
  }
  return age
})

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
userSchema.pre('save', async function save(next) {
  try {
    
    if (!this.isModified('password')) return next();

    const rounds = env === 'test' ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(new APIError(error));
  }
});

/**
 * Methods
 */
userSchema.method({
  async token(ip) {
    try {
      const payload = {
        entityType: 'USER',
        entity: this,
        ipAddress: ip,
        channel: 'MOBILE'
      };
      await LoginSession.updateMany({entity:this},{$set:{isActive:false}})
      const sessionToken = await LoginSession.createSession(payload)
      const token = await jwt.sign(sessionToken, jwtSecret)
      return token
    } catch (error) {
      throw error
    }
  },
  transform() {
    const transformed = {};

    const fields = [
      'id',
      'mobile',
      'email',
      'firstName',
      'lastName',
      'gender',
      'dob',
      'referralCode',
      'mobileDeviceInfo',
      'role',
      'age',
      'location',
      'picture',
      'createdAt',
      'updatedAt'
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  },
});

/**
 * Statics
 */
userSchema.statics = {

  roles,

  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let user;

      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await this.findById(id).exec();
      }
      if (user) {
        return user;
      }

      throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  async getByMobile(mobile) {
    try {
      let user;

      if (mobile && mobile.number && mobile.countryCode) {
        user = await this.findOne({ 'mobile.countryCode': mobile.countryCode, 'mobile.number': mobile.number }).exec();
      }
      if (user) {
        return user;
      }

      return null
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { mobile, refreshObject, ip } = options;
    if (!mobile) throw new APIError({ message: 'A mobile number is required to generate a token' });

    const user = await this.findOne({ 'mobile.countryCode': mobile.countryCode, 'mobile.number': mobile.number }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (mobile) {
      if (user) {
        const accessToken = await user.token(ip);
        return { user: user.transform(), accessToken };
      }
      err.message = 'Incorrect mobile';
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = 'Invalid refresh token.';
      } else {
        return { user, accessToken: user.token() };
      }
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new APIError(err);
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  async list({
    page = 1, perPage = 30, name, email, search
  }) {
    const options = omitBy({ name,email }, isNil);
    let queryArr = []

    if (search && search.length > 0) {
      queryArr.push({ name: { $regex: search, $options: 'i' } })
      queryArr.push({ "mobile.number": { $regex: search, $options: 'i' } })
      queryArr.push({ email: { $regex: search, $options: 'i' } })
    } else {
        queryArr.push({})
  }
    let users = await this.find({$and: [options, { $or: queryArr }]})
        .sort({ seqNumber: 1 })
        .skip(perPage * (page * 1 - 1))
        .limit(perPage * 1)
        .exec();
    users = users.map(user => user.transform())
    var count = await this.find({$and: [options, { $or: queryArr }]}).exec();
    count = count.length;
    var pages = Math.ceil(count / perPage);

    return { users, count, pages }
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'email',
          location: 'body',
          messages: ['"email" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

  async oAuthLogin({
    service, id, email, name, picture,
  }) {
    const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] });
    if (user) {
      user.services[service] = id;
      if (!user.name) user.name = name;
      if (!user.picture) user.picture = picture;
      return user.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id }, email, password, name, picture,
    });
  },
};

/**
 * @typedef User
 */
module.exports = mongoose.model('User', userSchema);
