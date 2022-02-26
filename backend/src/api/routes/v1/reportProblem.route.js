
const controller = require("@controllers/reportProblem.controller")
const express = require('express');
const router = express.Router();
const { authorize } = require('@middlewares/auth');

router.param('blockId', controller.load);

router
    .route('/')
    .get(authorize(),controller.list)
    .post(authorize(),controller.create)

router
    .route('/:blockId')
    .get(authorize(), controller.get)
    .delete(authorize(), controller.remove);

module.exports = router;
