const express = require("express");
const UserRouter = express.Router();

// Controllers
const UserController = require("../Controller/UserController");
const upload = require('../Middleware/multer'); // Middleware de téléchargement de fichiers

const {
    checkRegisterInput,
    checkLoginInput,
    checkUserUpdateInput,
} = require("../Validation/UserDataRules");

const {
    inputValidationMiddleware,
} = require("../Validation/ValidationMiddleware");
const {
    userAuthorizationHandler,
} = require("./../Middleware/UserAuthorizationMiddleware");

UserRouter.route("/")
    .get(userAuthorizationHandler("admin"), UserController.getAllUser)
    .patch(upload, UserController.updateUser) // Utiliser multer pour gérer le téléchargement de fichiers
    .delete(UserController.deleteAllUser);

UserRouter.route("/:id")
    .get(UserController.getSingleUser)
    .delete(userAuthorizationHandler("admin"), UserController.deleteUser);

module.exports = UserRouter;