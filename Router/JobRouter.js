const express = require("express");
const JobRouter = express.Router(); // create a router
const {
    authenticateUser,
} = require("./../Middleware/UserAuthenticationMiddleware");
// Controllers
const JobController = require("../Controller/JobController");
const { checkJobInput } = require("../Validation/JobDataRules");
const {
    inputValidationMiddleware,
} = require("../Validation/ValidationMiddleware");

const {
    userAuthorizationHandler,
} = require("./../Middleware/UserAuthorizationMiddleware");


// Routes
JobRouter.get(
    "/info",
    JobController.getAllInfo
);
JobRouter.route("/")
    .get(JobController.getAllJobs)
    .post(
        authenticateUser,
        userAuthorizationHandler("recruiter"),
        checkJobInput,
        inputValidationMiddleware,
        JobController.addJob
    )
    .delete(authenticateUser,JobController.deleteAllJobs);

JobRouter.get("/my-jobs", authenticateUser,JobController.getMyJobs);
JobRouter.route("/:id")
    .get(JobController.getSingleJob)
    .patch(
        authenticateUser,
        userAuthorizationHandler("recruiter"),
        checkJobInput,
        inputValidationMiddleware,
        JobController.updateSingleJob
    )
    .delete(
        authenticateUser,
        userAuthorizationHandler("recruiter"),
        JobController.deleteSingleJob
    );

module.exports = JobRouter;


