const httpStatus = require('http-status');
const { omit } = require('lodash');
const Admin = require('@models/auth/admin.model');
const APIError = require('@utils/APIError');

/**
 * Load admin and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const admin = await Admin.get(id);
    req.locals = { admin };
    return next();
  } catch (error) {
    return next(new APIError(error));
  }
};

/**
 * Get admin
 * @public
 */
exports.get = (req, res) => res.status(httpStatus.OK).json(req.locals.admin.transform());

/**
 * Create new admin
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const admin = new Admin(req.body);
    const savedAdmin = await admin.save();
    res.status(httpStatus.CREATED);
    res.json(savedAdmin.transform());
  } catch (error) {
    next(Admin.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing admin
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { admin } = req.locals;
    const newAdmin = new Admin(req.body);
    const ommitRole = admin.role !== 'admin' ? 'role' : '';
    const newAdminObject = omit(newAdmin.toObject(), '_id', ommitRole);

    await admin.updateOne(newAdminObject, { override: true, upsert: true });
    const savedAdmin = await Admin.findById(admin._id);
    res.status(httpStatus.OK).json(savedAdmin.transform());
  } catch (error) {
    next(Admin.checkDuplicateEmail(error));
  }
};

/**
 * Update existing admin
 * @public
 */
exports.update = (req, res, next) => {
  const ommitRole = req.locals.admin.role !== 'admin' ? 'role' : '';
  const updatedAdmin = omit(req.body, ommitRole);
  const admin = Object.assign(req.locals.admin, updatedAdmin);


  admin.save()
    .then(savedAdmin => res.status(httpStatus.OK).json(savedAdmin.transform()))
    .catch(e => next(Admin.checkDuplicateEmail(e)));
};

/**
 * Get admin list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const admins = await Admin.list(req.query);
    res.status(httpStatus.OK).json(admins);
  } catch (error) {
    return next(new APIError(error));
  }
};

/**
 * Delete admin
 * @public
 */
exports.remove = (req, res, next) => {
  const { admin } = req.locals;

  admin.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { clientIp } = req
    const { admin, accessToken } = await Admin.findAndGenerateToken({ email, password, ip: clientIp })
    if (admin && admin.firstLogin) {
      res.status(httpStatus.OK).json({ admin, accessToken, 'message': 'Change Password' })
    } else {
      res.status(httpStatus.OK).json({ admin, accessToken })
    }
  } catch (error) {
    return next(Admin.checkDuplicateEmail(error));
  }
}