const httpStatus = require('http-status');
const { omit } = require('lodash');
const FeedComment = require("@models/feed.comment.model")
const APIError = require('@utils/APIError');

/**
 * Load FeedComment and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
   try {
      const feedComment = await FeedComment.get(id);
      req.locals = { feedComment };
      return next();
   } catch (error) {
      next(new APIError(error));
   }
};

/**
 * Get feedComment
 * @public
 */
exports.get = (req, res) => res.json(req.locals.feedComment);

/**
 * Create new feedComment
 * @public
 */
exports.create = async (req, res, next) => {
   try {
      let { entity } = req.session
      req.body.user = entity
      const feedComment = new FeedComment(req.body);
      const savedFeedComment = await feedComment.save();
      return res.json(savedFeedComment)
   } catch (error) {
      next(new APIError(error));
   }
};

/**
 * Replace existing feedComment
 * @public
 */
exports.replace = async (req, res, next) => {
   try {
      const { feedComment } = req.locals;
      const newFeedCommentDetails = new FeedComment(req.body);
      const newFeedComment = omit(newFeedCommentDetails.toObject(), '_id');

      await feedComment.updateOne(newFeedComment, { override: true, upsert: true });
      const savedFeedComment = await FeedComment.findById(feedComment._id);

      res.json(savedFeedComment.transform());
   } catch (error) {
      next(new APIError(error));
   }
};

/**
 * Update existing feedComment
 * @public
 */
exports.update = async(req, res, next) => {
   try{
      const updatedFeedComment = omit(req.body);
      const feedComment = Object.assign(req.locals.feedComment, updatedFeedComment);
   
      let comment = await feedComment.save()
      res.json(comment)
   }catch(error){
      next(new APIError(error));
   }
};

/**
 * Get feedComment list
 * @public
 */
exports.list = async (req, res, next) => {
   try {
      const feedComments = await FeedComment.list(req.query);
      res.json(feedComments);
   } catch (error) {
      next(new APIError(error));
   }
};

/**
 * Delete feedComment
 * @public
 */
exports.remove = async(req, res, next) => {
   try{
      const { feedComment } = req.locals;
      const { entity } = req.session
      if(feedComment.user+"" == entity+""){
         feedComment.isDeleted = true
         await feedComment.save()
         res.json({message:"Success"})
      }else{
         next(new APIError({message:"Can't delete the comment, not created by you"}));
      }
   }catch(error){
      next(new APIError(error));
   }
};
