const { check } = require("express-validator");
const { JOB_TYPE, JOB_STATUS, JOB_Modality,JOB_IncomePeriod , JOB_IncomeCurrency } = require("../Utils/JobConstants");

exports.checkJobInput = [
    check("company").trim().notEmpty().withMessage("Job must have a Company"),
    check("titre").trim().notEmpty().withMessage("Job must have a titre"),
    check("jobLocation")
        .trim()
        .notEmpty()
        .withMessage("Job location is required"),
    check("jobStatus")
        .isIn(Object.values(JOB_STATUS))
        .withMessage("Invalid job status"),
    check("jobType")
        .isIn(Object.values(JOB_TYPE))
        .withMessage("Invalid job type"),
    check("jobModality")
        .isIn(Object.values(JOB_Modality))
        .withMessage("Invalid job modality"),
    check("TargetProfile")
        .trim()
        .notEmpty()
        .withMessage("Job Target Profile is requried"),
    check("jobSalary").trim().notEmpty().withMessage("Job Salary is requried"),
    check("IncomePeriod")
        .isIn(Object.values(JOB_IncomePeriod))
        .withMessage("Invalid job Income Period"),
    check("IncomeCurrency")
        .isIn(Object.values(JOB_IncomeCurrency))
        .withMessage("Invalid job Income Currency"),
        check("YearsOfExperienceRequired").trim().notEmpty().withMessage("Job Years Of Experience Require is requried"),
    check("YearsOfExperienceRecommanded").trim().notEmpty().withMessage("Job Years Of Experience Recommanded is requried"),
    check("jobDeadline")
        .trim()
        .notEmpty()
        .withMessage("Job Deadline is requried"),
    check("jobDescription")
        .trim()
        .notEmpty()
        .withMessage("Job Description is requried"),
    check("jobSkills").isArray({ min: 1 }).withMessage("Job Skills is requrie"),
    check("OptionalQualifications").isArray({ min: 1 }).withMessage("Job Optional Qualifications is requrie"),
    check("jobBenefits")
        .isArray({ min: 1 })
        .withMessage("Job Benefits is requrie"),
    check("jobContact")
        .trim()
        .notEmpty()
        .withMessage("Job contact is requried"),
];
