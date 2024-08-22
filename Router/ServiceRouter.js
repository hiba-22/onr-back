const express = require('express');
const ServiceRouter = express.Router();
const multer = require('multer');
const { authenticateUser } = require('../Middleware/UserAuthenticationMiddleware');
const { userAuthorizationHandler } = require('../Middleware/UserAuthorizationMiddleware');

const ServiceController = require('../Controller/ServiceController');
const multerStorageConfig = require('../Middleware/multer_Service');// Assuming you have multer configuration

// Multer middleware for handling file uploads
const upload = multer({
    storage: multerStorageConfig.storage, // Your multer storage configuration
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    },
    fileFilter: multerStorageConfig.fileFilter, // Your multer file filter configuration
});

// Routes for Services
ServiceRouter.route('/')
    .get(ServiceController.getAllServices)
    .post(
        authenticateUser,
        userAuthorizationHandler('recruiter'),
        upload.array('images', 3), // Handle multiple image uploads with 'images' field name
        ServiceController.addService
    )
    .delete(authenticateUser, ServiceController.deleteAllServices);

ServiceRouter.get('/my-services', authenticateUser, ServiceController.getMyServices);

ServiceRouter.route('/:id')
    .get(ServiceController.getSingleService)
    .put(
        authenticateUser,
        userAuthorizationHandler('recruiter'),
        upload.array('images', 3), // Handle multiple image uploads with 'images' field name
        ServiceController.updateSingleService
    )
    .delete(
        authenticateUser,
        userAuthorizationHandler('recruiter'),
        ServiceController.deleteSingleService
    );

module.exports = ServiceRouter;
