const express = require('express');
const controller = require('@controllers/admin.controller');
const router = express.Router();
const { authorize } = require('@middlewares/auth');

/**
 * Load user when API with userId route parameter is hit
 */
router.param('adminId', controller.load);

router
    .route('/')
    .get(authorize(), controller.list)
    .post(controller.create);


router.route('/login')
    .post(controller.adminLogin)

router
    .route('/:adminId')
    .get(authorize(), controller.get)
    .put(authorize(), controller.replace)
    .patch(authorize(), controller.update)
    .delete(authorize(), controller.remove);

module.exports = router;
