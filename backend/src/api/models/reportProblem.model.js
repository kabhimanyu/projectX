const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil, orderBy} = require('lodash');
const Schema = mongoose.Schema
const APIError = require('@utils/APIError');

const reportProblemSchema = new mongoose.Schema({
    user :{
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    feed :{
        type: Schema.Types.ObjectId,
        ref:'Feed'
    },
    type:{
        type:String,
        enum:["FEED","COMMENT","APP"]
    },
    description:{
        type:String,
    }
}, {
   timestamps: true,
});

reportProblemSchema.method({
   transform() {
      const transformed = {};
      const fields = ['id', 'user','type',
      'about',
      'description','createdAt','updatedAt'];

      fields.forEach((field) => {
         transformed[field] = this[field];
      });

      return transformed;
   },
})

reportProblemSchema.statics = {
   /**
      * Get reportProblem Type
      *
      * @param {ObjectId} id - The objectId of reportProblem Type.
      * @returns {Promise<User, APIError>}
      */
   async get(id) {
      try {
         let reportProblem;
         if (mongoose.Types.ObjectId.isValid(id)) {
            reportProblem = await this.findById(id).populate('user about','name mobile picture reportProblem').exec();
         }
         if (reportProblem) {
            return reportProblem;
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
      * List reportProblem Types in ascending order of platform partner name.
      *
      * @param {number} skip - Number of reportProblem types to be skipped.
      * @param {number} limit - Limit number of reportProblem types to be returned.
      * @returns {Promise<Subject[]>}
      */
   async list({ page = 1, perPage = 30, savedBy }) {
      const options = omitBy({ savedBy }, isNil);
      
      var count = await this.find(options).exec();
      let reportProblems = await this.find(options).populate('user about','name mobile picture reportProblem')
         .skip(perPage * (page * 1 - 1))
         .limit(perPage * 1)
         .sort({sentAt:1})
         .exec();
      reportProblems = reportProblems.map(partner => partner.transform())

      count = count.length;
      var pages = Math.ceil(count / count);
      return { reportProblems, count, pages }

   },
};


module.exports = mongoose.model('ReportProblem', reportProblemSchema);
