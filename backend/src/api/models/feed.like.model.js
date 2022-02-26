const mongoose = require("mongoose")
const Schema = mongoose.Schema
const { omitBy, isNil } = require('lodash');
const APIError = require('@utils/APIError');
const httpStatus = require('http-status');
const ObjectId = Schema.Types.ObjectId

var feedLikeSchema = new Schema({
    feed:{ type: ObjectId,ref:'Feed'},
    user:{ type: ObjectId , ref:'User'},
    type:{type:String,default:"LIKE"},
    status:{ type: Boolean,default:true},
    isDeleted:{ type: Boolean,default:false}
},
  { timestamps: true }
)

feedLikeSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "feed",
      "user",
      "status",
      "type",
      "isDeleted",
      "createdAt",
      "updatedAt",
      "id"
    ];
    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

feedLikeSchema.statics = {
  /**
   * Get feedLike Type
   *
   * @param {ObjectId} id - The objectId of feedLike Type.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let feedLike;
      if (mongoose.Types.ObjectId.isValid(id)) {
        feedLike = await this.findById(id).exec();
      }
      if (feedLike) {
        return feedLike
      }

      throw new APIError({
        message: "Feed Like does not exist",
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * List feedLike Types in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of feedLike types to be skipped.
   * @param {number} limit - Limit number of feedLike types to be returned.
   * @returns {Promise<Subject[]>}
   */
  async list({ page = 1, perPage = 30, feed, isDeleted }) {
    const options = omitBy({ feed,isDeleted }, isNil);

    let feedLikes = await this.find(options)
      .populate('user','_id name picture')
      .sort({ createdAt: -1 })
      .skip(perPage * (page * 1 - 1))
      .limit(perPage * 1)
      .exec();
    feedLikes = feedLikes.map((feedLike) => feedLike.transform());
    var count = await this.find(options).exec();
    count = count.length;
    var pages = Math.ceil(count / perPage);

    return { feedLikes, count, pages };
  },
};

module.exports = mongoose.model("FeedLike", feedLikeSchema)
