const httpStatus = require('http-status');
const passport = require('passport');
const User = require('@models/auth/user.model');
const APIError = require('@utils/APIError');

const handleJWT = (req, res, next, roles) => async (err, session, info) => {
  const error = err || info;
  const logIn = Promise.promisify(req.logIn);

  if (!session.isActive || session.logoutTime <= new Date()) {
    return next(new APIError({
      message: 'SESSION EXPIRED',
      status: httpStatus.UNAUTHORIZED,
    }));
  }

  const apiError = new APIError({
    message: error ? error.message : 'Unauthorized',
    status: httpStatus.UNAUTHORIZED,
    stack: error ? error.stack : undefined,
  });

  try {
    if (error || !session) throw error;
    await logIn(session, { session: false });
  } catch (e) {
    return next(apiError);
  }


  req.session = session;
  return next();
};

exports.authorize = (roles = User.roles) => (req, res, next) =>
  passport.authenticate(
    'jwt', { session: false },
    handleJWT(req, res, next, roles),
  )(req, res, next);

exports.oAuth = service =>
  passport.authenticate(service, { session: false });
