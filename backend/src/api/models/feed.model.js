const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil, orderBy} = require('lodash');
const Schema = mongoose.Schema
const APIError = require('@utils/APIError');

const feedSchema = new mongoose.Schema({
    customer :{
        type: Schema.Types.ObjectId,
        ref:'Customer'
    },
    friendGroup :{
        type: Schema.Types.ObjectId,
        ref:'friendgroup'
    },
    description:{
        type:String
    },
    album:{
      type: Schema.Types.ObjectId,
      ref:'Album'
    },
    base64media:{
      type:[{ 
          file: String
      }],
      default:[]
   },
    media:{
        type:[{ 
            fieldname: String,
            originalname: String,
            encoding: String,
            mimetype: String,
            destination: String,
            filename: String,
            path: String,
            size: Number
        }],
        default:[]
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    likeCount:{
       like:{
         type:Number,
         default:0
       },
       love:{
         type:Number,
         default:0
       },
       energy:{
         type:Number,
         default:0
       }
    },
    commentCount:{
      type:Number,
      default:0
    },
    color:{
      type:String,
      default:"#808080"
    }
}, {
   timestamps: true,
});

feedSchema.method({
   transform() {
      const transformed = {};
      const fields = ['id', 'customer',
      'friendGroup','likeCount','commentCount','base64media',
      'description',
      'media','color',
      'isDeleted'];

      fields.forEach((field) => {
         transformed[field] = this[field];
      });

      return transformed;
   },
})

feedSchema.statics = {
   /**
      * Get feed Type
      *
      * @param {ObjectId} id - The objectId of feed Type.
      * @returns {Promise<User, APIError>}
      */
   async get(id) {
      try {
         let feed;
         if (mongoose.Types.ObjectId.isValid(id)) {
            feed = await this.findById(id).populate('customer','name mobile picture feed').exec();
         }
         if (feed) {
            return feed;
         }

         throw new APIError({
            message: 'message does not exist',
            status: httpStatus.NOT_FOUND,
         });
      } catch (error) {
         throw error;
      }
   },

   /**
      * List feed Types in ascending order of platform partner name.
      *
      * @param {number} skip - Number of feed types to be skipped.
      * @param {number} limit - Limit number of feed types to be returned.
      * @returns {Promise<Subject[]>}
      */
   async list({ page = 1, perPage = 30, friendGroup,customer,isDeleted }) {
      const options = omitBy({ friendGroup,customer,isDeleted }, isNil);
      
      var count = await this.find(options).exec();
      let feeds = await this.find(options).populate('customer','name mobile picture')
         .skip(perPage * (page * 1 - 1))
         .limit(perPage * 1)
         .sort({createdAt:-1})
         .exec();
      feeds = feeds.map(partner => partner.transform())

      count = count.length;
      var pages = Math.ceil(count / count);
      return { feeds, count, pages }

   },
};


module.exports = mongoose.model('Feed', feedSchema);
