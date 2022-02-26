const express = require('express');
const controller = require('@controllers/feed.like.controller');
const { authorize } = require('@middlewares/auth');

const router = express.Router();
/**
 * Load id when API with id route parameter is hit
 */
router.param('feedLikeId', controller.load);


router
   .route('/')
   .get(authorize(),controller.list)
   .post(authorize(),controller.create)
   
router
   .route('/:feedLikeId')
   .get(authorize(), controller.get)
   .put(authorize(), controller.replace)
   .post(authorize(), controller.update)


module.exports = router;