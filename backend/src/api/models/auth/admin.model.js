const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const APIError = require('@utils/APIError');
const { env, jwtSecret } = require('@config/vars');
const LoginSession = require('@models/auth/login.session');

/**
 * Admin Schema
 * @private
 */
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128,
  },
  name: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true,
  },
  picture: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
adminSchema.pre('save', async function save(next) {
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
adminSchema.method({
  async token(ip) {
    try {
      const payload = {
        entityType: 'ADMIN',
        entity: this,
        ipAddress: ip,
        channel: 'WEB',
      };
      const sessionToken = await LoginSession.createSession(payload);
      const token = await jwt.sign(sessionToken, jwtSecret);
      return token;
    } catch (error) {
      throw error;
    }
  },
  transform() {
    const transformed = {};
    const fields = ['id', 'name', 'email', 'picture', 'role', 'createdAt'];

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
adminSchema.statics = {

  /**
    * Get admin
    *
    * @param {ObjectId} id - The objectId of admin.
    * @returns {Promise<Admin, APIError>}
    */
  async get(id) {
    try {
      let admin;

      if (mongoose.Types.ObjectId.isValid(id)) {
        admin = await this.findById(id).exec();
      }
      if (admin) {
        return admin;
      }

      throw new APIError({
        message: 'Admin does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
    * Find admin by email and tries to generate a JWT token
    *
    * @param {ObjectId} id - The objectId of admin.
    * @returns {Promise<Admin, APIError>}
    */
  async findAndGenerateToken(options) {
    const {
      email, password, ip, refreshObject,
    } = options;
    if (!email) throw new APIError({ message: 'An email is required to generate a token' });

    const admin = await this.findOne({ email }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (admin && await admin.passwordMatches(password)) {
        const accessToken = await admin.token(ip);
        return { admin, accessToken };
      }
      err.message = 'Incorrect email or password';
    } else if (refreshObject && refreshObject.adminEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = 'Invalid refresh token.';
      } else {
        return { admin, accessToken: admin.token() };
      }
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new APIError(err);
  },

  /**
    * List admins in descending order of 'createdAt' timestamp.
    *
    * @param {number} skip - Number of admins to be skipped.
    * @param {number} limit - Limit number of admins to be returned.
    * @returns {Promise<Admin[]>}
    */
  async list({
    page = 1, perPage = 30, firstName, lastName, email, role, search
  }) {
    let options = omitBy({ firstName, lastName, email, role }, isNil);
    if(search && search.length > 0){
      let queryArr = []
      queryArr.push({ "name": { $regex: search, $options: 'i' } })
      queryArr.push({ "email": { $regex: search, $options: 'i' } })
      queryArr.push({ "mobile": { $regex: search, $options: 'i' } })
      options = { $and: [options, { $or: queryArr }] }
    }

    let admins = await this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage * 1)
      .exec();
    admins = admins.map(admin => admin.transform());
    let count = await this.find(options).exec();
    count = count.length;
    const pages = Math.ceil(count / perPage);
    return { admins, count, pages };
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
};

/**
 * @typedef Admin
 */
module.exports = mongoose.model('Admin', adminSchema);
