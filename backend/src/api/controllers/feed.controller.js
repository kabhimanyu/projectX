const Feed = require("@models/feed.model")
const APIError = require('@utils/APIError');
const httpStatus = require('http-status');
const { omit } = require('lodash');

/**
 * Load Order and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
    try {
       const feed = await Feed.get(id);
       req.locals = { feed };
       return next();
    } catch (error) {
       next(new APIError(error));
    }
 };

 /**
 * Get package
 * @public
 */
exports.get = (req, res) => res.json(req.locals.feed.transform());


/**
 * Update existing agent
 * @public
 */
exports.update = (req, res, next) => {
    const updatedFeed = omit(req.body);
    const chatM = Object.assign(req.locals.feed, updatedFeed);

    chatM.save()
       .then(savedFeed => res.json(savedFeed))
       .catch(e => next(new APIError(e)));
 };

/**
 * Create new package
 * @public
 */
exports.create = async (req, res, next) => {
    try {
       let { entity } = req.session
       req.body.customer = entity
       const feed = new Feed(req.body);
       const savedFeed = await feed.save();
       return res.json(savedFeed)
    } catch (error) {
       next(new APIError(error));
    }
 };

 exports.setMedia = async(req, res, next) => {
    try{
       let media;
       let { feed } = req.locals
       if(req.files && req.files.length > 0){
          media = req.files
          media = await media.map((ele)=>{
            ele.path = `/Feed/${ele.filename}`;
            return ele
          })
          if(!feed){
             req.body.media = media
          }else{
             req.body.media = feed.media.concat(media)
          }
          next()
       }else{
          next()
       }
    }catch(error){
       next(new APIError(error));
    }
 };

 /**
 * Delete feed
 * @public
 */
exports.remove = async(req, res, next) => {
    try{
       const { feed } = req.locals;
       feed.isDeleted = true
       await feed.save()
       res.status(httpStatus.NO_CONTENT).end()
    }catch(error){
       next(new APIError(error));
    }
 };
 
 /**
 * Get feed list
 * @public
 */
exports.list = async (req, res, next) => {
    try {
        let { entity }= req.session
         req.query.user = entity
         req.query.isDeleted = false
         let feeds = await Feed.list(req.query);
         req.locals = { feeds }
         return next()
    } catch (error) {
       next(new APIError(error));
    }
 };
 