const express = require('express');
const controller = require('@controllers/user.controller');
const { authorize } = require('@middlewares/auth');


const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('userId', controller.load);

router
  .route('/')
  .get(authorize(), controller.list)
  .post(authorize(), controller.create);

router
  .route('/profile')
  .get(authorize(), controller.loggedIn);

router
  .route('/:userId')
  .get(authorize(), controller.get)
  .put(authorize(), controller.replace)
  .patch(authorize(), controller.update)
  .delete(authorize(), controller.remove);

module.exports = router;
