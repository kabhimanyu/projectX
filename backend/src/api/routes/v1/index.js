const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const adminRoutes = require('./admin.route');
const feedRoute = require("./feed.route")
const feedLikeRoutes = require("./feed.like.route");
const feedCommentRoutes = require("./feed.comment.route");
const reportProblemRoute = require("./reportProblem.route")

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/feed', feedRoute);
router.use('/feedLike', feedLikeRoutes);
router.use('/feedComment', feedCommentRoutes);
router.use('/reportProblem', reportProblemRoute);

module.exports = router;
