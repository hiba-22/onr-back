const JobModel = require("../Model/JobModel");
const ApplicationModel = require("../Model/ApplicationModel");

const createError = require("http-errors");
const mongoose = require("mongoose");

exports.getAllInfo = async (req, res, next) => {
    try {
        const jobs = await JobModel.find({});

        const CDD =await JobModel.find({ jobType: "CDD" });
        const CDI =await JobModel.find({ jobType: "CDI" });
        const INTERNSHIP =await JobModel.find({ jobType: "internship" });
        const FREELANCE =await JobModel.find({ jobType: "freelance" });

        res.status(200).json({
            job: jobs?.length || 0,
            CDD :CDD?.length || 0,
            CDI :CDI?.length || 0,
            INTERNSHIP :INTERNSHIP?.length || 0,
            FREELANCE :FREELANCE?.length || 0,

        });
    } catch (error) {
        next(createError(500, error.message));
    }
};
module.exports.getAllJobs = async (req, res, next) => {
    try {
        const filters = { ...req.query }; // faire une copie pour que l'original ne soit pas moidifié

        // exclude
        const excludeFields = ["sort", "page", "limit", "fields", "search"];
        excludeFields.forEach((field) => delete filters[field]);

        const queries = {};

        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            queries.sortBy = sortBy;
        }

        if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            queries.fields = fields;
        }
        if (req.query.limit) {
            const limit = req.query.limit.split(",").join(" ");
            queries.limit = limit;
        }
        if (req.query.search) {
            const searchQuery = req.query.search;
            filters.$or = [
                {
                    company: {
                        $regex: new RegExp(".*" + searchQuery + ".*", "i"),
                    },
                },
                {
                    titre: {
                        $regex: new RegExp(".*" + searchQuery + ".*", "i"),
                    },
                },
                {
                    jobStatus: {
                        $regex: new RegExp(".*" + searchQuery + ".*", "i"),
                    },
                },
                {
                    jobType: {
                        $regex: new RegExp(".*" + searchQuery + ".*", "i"),
                    },
                },
                {
                    jobModality: {
                        $regex: new RegExp(".*" + searchQuery + ".*", "i"),
                    },
                },
                {
                    jobLocation: {
                        $regex: new RegExp(".*" + searchQuery + ".*", "i"),
                    },
                },
                // Ajouter d'autres champs selon les besoins
            ];
        }
        if (req.query.page) {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 6);
            const skip = (page - 1) * limit;

            queries.skip = skip;
            queries.limit = limit;
            queries.page = page;
        }

        const { result, totalJobs, pageCount, page } = await getData(
            filters,
            queries
        );

        // response
        if (result.length !== 0) {
            res.status(200).json({
                status: true,
                result,
                totalJobs,
                currentPage: page,
                pageCount,
            });
        } else {
            next(createError(500, "Job List is empty"));
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports.getMyJobs = async (req, res, next) => {
    try {
        const result = await JobModel.find({
            createdBy: req.user._id,
        }).populate("createdBy", "username email");
        // dans le remplissage, donnez uniquement le "username (champ sélectionné) ou uniquement les champs omis (-password)", sinon vous affichez une erreur
        if (result?.length) {
            res.status(200).json({
                status: true,
                result,
            });
        } else {
            res.status(400).json({
                message: "Job not found",
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

const getData = async (filters, queries) => {
    let sortCriteria = {};

    if (queries.sortBy) {
        switch (queries.sortBy) {
            case "newest":
                sortCriteria = { createdAt: -1 };
                break;
            case "oldest":
                sortCriteria = { createdAt: 1 };
                break;
            case "a-z":
                sortCriteria = { titre: 1 };
                break;
            case "z-a":
                sortCriteria = { titre: -1 };
                break;
            default:
                // Default sorting criteria si aucune des options ne correspond
                sortCriteria = { createdAt: -1 };
                break;
        }
    } else {
        // Default sorting criteria si le paramètre sortBy n'est pas fourni
        sortCriteria = { createdAt: -1 };
    }
    const result = await JobModel.find(filters)
        .skip(queries.skip)
        .limit(queries.limit)
        .sort(sortCriteria)
        .select(queries.fields);

    //  il ne dépend pas du précédent, son numéro de document sera basé sur le filtre passé ici
    const totalJobs = await JobModel.countDocuments(filters);
    const pageCount = Math.ceil(totalJobs / queries.limit);
    return { result, totalJobs, pageCount, page: queries.page };
};

module.exports.getSingleJob = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Job ID format"));
        }
        const result = await JobModel.findById(id);
        if (!result) {
            next(createError(500, "Job not found"));
        } else {
            res.status(200).json({
                status: true,
                result,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

module.exports.addJob = async (req, res, next) => {
    const jobData = req.body;
    try {
        const isJobExists = await JobModel.findOne({
            company: jobData.comapny,
        });
        if (isJobExists) {
            next(createError(500, "Job data already exist"));
        } else {
            console.log(req?.user);
            jobData.createdBy = req?.user?._id;
            const newJob = new JobModel(jobData);
            const result = await newJob.save();

            res.status(201).json({
                status: true,
                result,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

module.exports.updateSingleJob = async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Job ID format"));
        }

        const isJobExists = await JobModel.findOne({ _id: id });
        if (!isJobExists) {
            next(createError(500, "Job not found"));
        } else {
            const updatedJob = await JobModel.findByIdAndUpdate(id, data, {
                new: true,
            });
            res.status(200).json({
                status: true,
                message: "Job Updated",
                result: updatedJob,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

module.exports.deleteSingleJob = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Job ID format"));
        }

        const isJobExists = await JobModel.findOne({ _id: id });
        if (!isJobExists) {
            res.status(500).json({
                status: false,
                message: "Job not found",
            });
        } else {
            // Recherche et suppression des applications associées

            await ApplicationModel.deleteMany({ jobId: id });
            const result = await JobModel.findByIdAndDelete(id);

            res.status(200).json({
                status: true,
                message: "Job Deleted",
                result,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

module.exports.deleteAllJobs = async (req, res, next) => {
    try {
        result = await JobModel.deleteMany({});
        res.status(201).json({
            status: true,
            result,
        });
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};
