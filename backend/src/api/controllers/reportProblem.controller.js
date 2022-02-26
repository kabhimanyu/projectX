const ReportProblem = require("@models/reportProblem.model")
const APIError = require('@utils/APIError');
const httpStatus = require('http-status');
const { omit } = require('lodash');


/**
 * Load Order and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
    try {
        const reportProblem = await ReportProblem.get(id);
        req.locals = { reportProblem };
        return next();
    } catch (error) {
        return next(new APIError(error));
    }
 };

 /**
 * Get reportProblem obj
 * @public
 */
exports.get = (req, res) => res.json(req.locals.reportProblem);


/**
 * Create new reportProblem obj
 * @public
 */
exports.create = async (req, res, next) => {
    try {
        let { entity } = req.session
        req.body.user = entity
        const reportProblem = new ReportProblem(req.body);
        const savedreportProblem = await reportProblem.save();
        res.status(httpStatus.CREATED);
        return res.json(savedreportProblem.transform());
    } catch (error) {
        return next(new APIError(error));
    }
 };



/**
 * remove new reportProblem obj
 * @public
 */
exports.remove = async (req, res, next) => {
    try {
       const {reportProblem} = req.locals
       let rP = Object.assign(reportProblem, {isActive:false});
       rP = await ReportProblem.save()
       return res.json(rP)
    } catch (error) {
        return next(new APIError(error));
    }
 };

  /**
 * Get feed list
 * @public
 */
exports.list = async (req, res, next) => {
    try {
        let reportProblems = await ReportProblem.list(req.query);
        return res.json(reportProblems)
    } catch (error) { 
       next(new APIError(error));
    }
 };