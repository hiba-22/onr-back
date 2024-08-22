const mongoose = require("mongoose");
const { JOB_STATUS, JOB_TYPE, JOB_Modality, JOB_IncomePeriod,JOB_IncomeCurrency } = require("../Utils/JobConstants");


const JobSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            requried: [true, "A Company name is requried"],
            trim: true,
            minLength: [5, "Company name is too short"],
            maxLength: [100, "Company name is too long"],
        },
        titre: {
            type: String,
            requried: [true, "Job must have a Position"],
            trim: true,
            minLength: [5, "Company name is too short"],
            maxLength: [200, "Company name is too long"],
        },
        jobStatus: {
            type: String,
            enum: Object.values(JOB_STATUS),
            default: JOB_STATUS.PENDING,
        },
        jobType: {
            type: String,
            enum: Object.values(JOB_TYPE),
            default: JOB_TYPE.CDD,
        },
        jobModality: {
            type: String,
            enum: Object.values(JOB_Modality),
            default: JOB_Modality.CDD,
        },
        jobLocation: {
            type: String,
            required: [true, "Job must have a location"],
        },
        createdBy: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
        TargetProfile: {
            type: String,
            requried: [true, "Job Benefits is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        jobSalary: {
            type: String,
            requried: [true, "Job Salary is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        IncomePeriod: {
            type: String,
            enum: Object.values(JOB_IncomePeriod),
            default: JOB_IncomePeriod.PERMONTH,
        },
        IncomeCurrency: {
            type: String,
            enum: Object.values(JOB_IncomeCurrency),
            default: JOB_IncomeCurrency.Euro,
        },
        YearsOfExperienceRequired: {
            type: String,
            requried: [true, "YearsOfExperienceRequire is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        YearsOfExperienceRecommanded: {
            type: String,
            requried: [true, "YearsOfExperienceRecommanded is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        jobDeadline: {
            type: String,
            requried: [true, "Job Deadline is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        jobDescription: {
            type: String,
            requried: [true, "Job Description is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        jobSkills: {
            type: [],
            requried: [true, "Job Skills is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        OptionalQualifications: {
            type: [],
            requried: [true, "Optional Qualifications is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        jobBenefits: {
            type: [],
            requried: [true, "Job facilities is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
        jobContact: {
            type: String,
            requried: [true, "Job contact is requried"],
            trim: true,
            // minLength: [5, "Company name is too short"],
            // maxLength: [100, "Company name is too long"],
        },
    },
    { timestamps: true } // pour garder une trace
);



const JobModel = mongoose.model("Job", JobSchema);
module.exports = JobModel;
