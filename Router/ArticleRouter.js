const express = require('express');
const ArticleRouter = express.Router();
const multer = require('multer');
const { authenticateUser } = require('../Middleware/UserAuthenticationMiddleware');
const { userAuthorizationHandler } = require('../Middleware/UserAuthorizationMiddleware');

const ArticleController = require('../Controller/ArticleController');
const multerStorageConfig = require('../Middleware/multer_article');// Assuming you have multer configuration

// Multer middleware for handling file uploads
const upload = multer({
    storage: multerStorageConfig.storage, // Your multer storage configuration
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    },
    fileFilter: multerStorageConfig.fileFilter, // Your multer file filter configuration
});

// Routes for articles
ArticleRouter.route('/')
    .get(ArticleController.getAllArticles)
    .post(
        authenticateUser,
        userAuthorizationHandler('recruiter'),
        upload.array('images', 3), // Handle multiple image uploads with 'images' field name
        ArticleController.addArticle
    )
    .delete(authenticateUser, ArticleController.deleteAllArticles);

ArticleRouter.get('/my-articles', authenticateUser, ArticleController.getMyArticles);

ArticleRouter.route('/:id')
    .get(ArticleController.getSingleArticle)
    .put(
        authenticateUser,
        userAuthorizationHandler('recruiter'),
        upload.array('images', 3), // Handle multiple image uploads with 'images' field name
        ArticleController.updateSingleArticle
    )
    .delete(
        authenticateUser,
        userAuthorizationHandler('recruiter'),
        ArticleController.deleteSingleArticle
    );

module.exports = ArticleRouter;
