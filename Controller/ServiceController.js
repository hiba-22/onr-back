const ServiceModel = require("../Model/ServiceModel");
const createError = require("http-errors");
const mongoose = require("mongoose");
const multer = require('multer');
const path = require('path');
const { bucket } = require("../Firebase/firebaseConfig");
// Obtenir tous les Services
module.exports.getAllServices = async (req, res, next) => {
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
                    titre: {
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

        const { result, totalServices, pageCount, page } = await getData(
            filters,
            queries
        );

        // response
        if (result.length !== 0) {
            res.status(200).json({
                status: true,
                result,
                totalServices,
                currentPage: page,
                pageCount,
            });
        } else {
            next(createError(500, "Service List is empty"));
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports.getMyServices = async (req, res, next) => {
    try {
        const result = await ServiceModel.find({
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
                message: "Service not found",
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
                sortCriteria = { position: 1 };
                break;
            case "z-a":
                sortCriteria = { position: -1 };
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
    const result = await ServiceModel.find(filters)
        .skip(queries.skip)
        .limit(queries.limit)
        .sort(sortCriteria)
        .select(queries.fields);

    //  il ne dépend pas du précédent, son numéro de document sera basé sur le filtre passé ici
    const totalServices = await ServiceModel.countDocuments(filters);
    const pageCount = Math.ceil(totalServices / queries.limit);
    return { result, totalServices, pageCount, page: queries.page };
};
// Obtenir un Service par ID
module.exports.getSingleService= async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Service ID format"));
        }
        const result = await ServiceModel.findById(id);
        if (!result) {
            next(createError(500, "Service not found"));
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
const { v4: uuidv4 } = require('uuid');

module.exports.addService = async (req, res, next) => {
    const ServiceData = req.body;
    const images = req.files; // Assuming multer middleware is used to handle file uploads
    
    try {
        // Upload each image to Firebase Storage and get download URLs
        const imageUrls = [];
        for (const image of images) {
            const { originalname, buffer } = image;
            const uuid = uuidv4(); // Generate unique filename
            const filename = `Services/${uuid}-${originalname}`;
            const file = bucket.file(filename);

            // Create upload stream
            const stream = file.createWriteStream({
                metadata: {
                    contentType: image.mimetype
                }
            });

            // Handle upload errors
            stream.on('error', err => {
                console.error('Error uploading image to Firebase:', err);
                next(createError(500, 'Failed to upload image to Firebase'));
            });

            // Handle upload completion
            stream.on('finish', async () => {
                // Make the file public and get download URL
                await file.makePublic();
                const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                imageUrls.push(imageUrl);

                // If all images are uploaded, save Service with image URLs
                if (imageUrls.length === images.length) {
                    ServiceData.images = imageUrls;
                    ServiceData.createdBy = req.user._id;
                    
                    const newService = new ServiceModel(ServiceData);
                    const result = await newService.save();

                    res.status(201).json({
                        status: true,
                        result,
                    });
                }
            });

            // Write buffer to the stream
            stream.end(buffer);
        }
    } catch (error) {
        next(createError(500, `Something went wrong: ${error.message}`));
    }
};




module.exports.updateSingleService = async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    const images = req.files; // Supposant que vous utilisez multer pour gérer les téléchargements de fichiers

    try {
        // Vérifier si des images sont téléchargées
        if (images && images.length > 0) {
            // Gérer les images si elles sont présentes
            await handleImageUploads(id, images);
        }

        // Convertir les champs services, community, references en tableaux si ce n'est pas déjà le cas
        if (data.services) data.services = data.services.split(",");
        if (data.community) data.community = data.community.split(",");
        if (data.references) data.references = data.references.split(",");

        // Mettre à jour les autres champs de l'Service sans toucher aux images
        if (!isEmptyObject(data)) { // Vérifier si data n'est pas vide
            delete data.images; // Supprimer le champ images pour éviter la mise à jour

            const updatedService = await ServiceModel.findByIdAndUpdate(id, data, { new: true });

            res.status(200).json({
                status: true,
                message: 'Service mis à jour avec succès',
                result: updatedService,
            });
        } else {
            res.status(200).json({
                status: true,
                message: 'Aucune modification autre que les images n\'a été apportée',
            });
        }
    } catch (error) {
        next(createError(500, `Quelque chose s'est mal passé : ${error.message}`));
    }
};

// Fonction pour gérer le téléchargement d'images
async function handleImageUploads(id, images) {
    const imageUrls = [];

    for (const image of images) {
        const { originalname, buffer } = image;
        const uuid = uuidv4(); // Générer un nom de fichier unique
        const filename = `Services/${uuid}-${originalname}`;
        const file = bucket.file(filename);

        // Créer un flux d'upload
        const stream = file.createWriteStream({
            metadata: {
                contentType: image.mimetype,
            },
        });

        // Gérer les erreurs de téléchargement
        stream.on('error', err => {
            console.error('Erreur lors du téléchargement de l\'image vers Firebase :', err);
            throw new Error('Échec du téléchargement de l\'image vers Firebase');
        });

        // Gérer la fin du téléchargement
        await new Promise((resolve, reject) => {
            stream.on('finish', async () => {
                // Rendre le fichier public et obtenir l'URL de téléchargement
                try {
                    await file.makePublic();
                    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                    imageUrls.push(imageUrl);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            // Écrire le tampon dans le flux
            stream.end(buffer);
        });
    }

    // Remplacer les URLs d'images existantes par les nouvelles URLs téléchargées
    await ServiceModel.findByIdAndUpdate(id, { images: imageUrls });
}

// Fonction utilitaire pour vérifier si un objet est vide
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}



/*module.exports.updateSingleService = async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    const images = req.files; // Assuming multer middleware is used to handle file uploads

    try {
        // Upload each image to Firebase Storage and get download URLs
        const imageUrls = [];
        for (const image of images) {
            const { originalname, buffer } = image;
            const uuid = uuidv4(); // Generate unique filename
            const filename = `Services/${uuid}-${originalname}`;
            const file = bucket.file(filename);

            // Create upload stream
            const stream = file.createWriteStream({
                metadata: {
                    contentType: image.mimetype
                }
            });

            // Handle upload errors
            stream.on('error', err => {
                console.error('Error uploading image to Firebase:', err);
                next(createError(500, 'Failed to upload image to Firebase'));
            });

            // Handle upload completion
            stream.on('finish', async () => {
                // Make the file public and get download URL
                await file.makePublic();
                const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                imageUrls.push(imageUrl);

                // If all images are uploaded, update Service with image URLs
                if (imageUrls.length === images.length) {
                    data.images = imageUrls;
                    const updatedService = await ServiceModel.findByIdAndUpdate(id, data, { new: true });

                    res.status(200).json({
                        status: true,
                        message: 'Service Updated',
                        result: updatedService,
                    });
                }
            });

            // Write buffer to the stream
            stream.end(buffer);
        }
    } catch (error) {
        next(createError(500, `Something went wrong: ${error.message}`));
    }
};

/*Créer un nouvel Service
module.exports.addService = async (req, res, next) => {
    const ServiceData = req.body;
    try {
        const isServiceExists = await ServiceModel.findOne({
            titre: ServiceData.titre,
        });
        if (isServiceExists) {
            next(createError(500, "Service data already exist"));
        } else {
            console.log(req?.user);
            ServiceData.createdBy = req?.user?._id;
            const newService = new ServiceModel(ServiceData);
            const result = await newService.save();

            res.status(201).json({
                status: true,
                result,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

// Mettre à jour un Service
module.exports.updateSingleService = async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Service ID format"));
        }

        const isJobExists = await ServiceModel.findOne({ _id: id });
        if (!isJobExists) {
            next(createError(500, "Service not found"));
        } else {
            const updatedService = await ServiceModel.findByIdAndUpdate(id, data, {
                new: true,
            });
            res.status(200).json({
                status: true,
                message: "Service Updated",
                result: updatedService,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};*/


// Supprimer un Service
module.exports.deleteSingleService = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Service ID format"));
        }

        const isServiceExists = await ServiceModel.findOne({ _id: id });
        if (!isServiceExists) {
            res.status(500).json({
                status: false,
                message: "Service not found",
            });
        } else {
            // Recherche et suppression 
            
            const result = await ServiceModel.findByIdAndDelete(id);

            res.status(200).json({
                status: true,
                message: "Service Deleted",
                result,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};
module.exports.deleteAllServices = async (req, res, next) => {
    try {
        result = await ServiceModel.deleteMany({});
        res.status(201).json({
            status: true,
            result,
        });
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};
