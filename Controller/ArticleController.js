const ArticleModel = require("../Model/ArticleModel");
const createError = require("http-errors");
const mongoose = require("mongoose");
const multer = require('multer');
const path = require('path');
const { bucket } = require("../Firebase/firebaseConfig");
// Obtenir tous les articles
module.exports.getAllArticles = async (req, res, next) => {
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

        const { result, totalArticles, pageCount, page } = await getData(
            filters,
            queries
        );

        // response
        if (result.length !== 0) {
            res.status(200).json({
                status: true,
                result,
                totalArticles,
                currentPage: page,
                pageCount,
            });
        } else {
            next(createError(500, "Article List is empty"));
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports.getMyArticles = async (req, res, next) => {
    try {
        const result = await ArticleModel.find({
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
                message: "Article not found",
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
    const result = await ArticleModel.find(filters)
        .skip(queries.skip)
        .limit(queries.limit)
        .sort(sortCriteria)
        .select(queries.fields);

    //  il ne dépend pas du précédent, son numéro de document sera basé sur le filtre passé ici
    const totalArticles = await ArticleModel.countDocuments(filters);
    const pageCount = Math.ceil(totalArticles / queries.limit);
    return { result, totalArticles, pageCount, page: queries.page };
};
// Obtenir un article par ID
module.exports.getSingleArticle= async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Article ID format"));
        }
        const result = await ArticleModel.findById(id);
        if (!result) {
            next(createError(500, "Article not found"));
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

module.exports.addArticle = async (req, res, next) => {
    const articleData = req.body;
    const images = req.files; // Assuming multer middleware is used to handle file uploads
    
    try {
        // Upload each image to Firebase Storage and get download URLs
        const imageUrls = [];
        for (const image of images) {
            const { originalname, buffer } = image;
            const uuid = uuidv4(); // Generate unique filename
            const filename = `articles/${uuid}-${originalname}`;
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

                // If all images are uploaded, save article with image URLs
                if (imageUrls.length === images.length) {
                    articleData.images = imageUrls;
                    articleData.createdBy = req.user._id;
                    
                    const newArticle = new ArticleModel(articleData);
                    const result = await newArticle.save();

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




module.exports.updateSingleArticle = async (req, res, next) => {
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

        // Mettre à jour les autres champs de l'article sans toucher aux images
        if (!isEmptyObject(data)) { // Vérifier si data n'est pas vide
            delete data.images; // Supprimer le champ images pour éviter la mise à jour

            const updatedArticle = await ArticleModel.findByIdAndUpdate(id, data, { new: true });

            res.status(200).json({
                status: true,
                message: 'Article mis à jour avec succès',
                result: updatedArticle,
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
        const filename = `articles/${uuid}-${originalname}`;
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
    await ArticleModel.findByIdAndUpdate(id, { images: imageUrls });
}

// Fonction utilitaire pour vérifier si un objet est vide
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}



/*module.exports.updateSingleArticle = async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    const images = req.files; // Assuming multer middleware is used to handle file uploads

    try {
        // Upload each image to Firebase Storage and get download URLs
        const imageUrls = [];
        for (const image of images) {
            const { originalname, buffer } = image;
            const uuid = uuidv4(); // Generate unique filename
            const filename = `articles/${uuid}-${originalname}`;
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

                // If all images are uploaded, update article with image URLs
                if (imageUrls.length === images.length) {
                    data.images = imageUrls;
                    const updatedArticle = await ArticleModel.findByIdAndUpdate(id, data, { new: true });

                    res.status(200).json({
                        status: true,
                        message: 'Article Updated',
                        result: updatedArticle,
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

/*Créer un nouvel article
module.exports.addArticle = async (req, res, next) => {
    const articleData = req.body;
    try {
        const isArticleExists = await ArticleModel.findOne({
            titre: articleData.titre,
        });
        if (isArticleExists) {
            next(createError(500, "Article data already exist"));
        } else {
            console.log(req?.user);
            articleData.createdBy = req?.user?._id;
            const newArticle = new ArticleModel(articleData);
            const result = await newArticle.save();

            res.status(201).json({
                status: true,
                result,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

// Mettre à jour un article
module.exports.updateSingleArticle = async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Article ID format"));
        }

        const isJobExists = await ArticleModel.findOne({ _id: id });
        if (!isJobExists) {
            next(createError(500, "Article not found"));
        } else {
            const updatedArticle = await ArticleModel.findByIdAndUpdate(id, data, {
                new: true,
            });
            res.status(200).json({
                status: true,
                message: "Article Updated",
                result: updatedArticle,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};*/


// Supprimer un article
module.exports.deleteSingleArticle = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid Article ID format"));
        }

        const isArticleExists = await ArticleModel.findOne({ _id: id });
        if (!isArticleExists) {
            res.status(500).json({
                status: false,
                message: "Article not found",
            });
        } else {
            // Recherche et suppression 
            
            const result = await ArticleModel.findByIdAndDelete(id);

            res.status(200).json({
                status: true,
                message: "Article Deleted",
                result,
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};
module.exports.deleteAllArticles = async (req, res, next) => {
    try {
        result = await ArticleModel.deleteMany({});
        res.status(201).json({
            status: true,
            result,
        });
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};
