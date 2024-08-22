const express = require("express");
const AuthRouter = express.Router(); // create a router

// Middleware
const { authenticateUser } = require("./../Middleware/UserAuthenticationMiddleware");

// Controllers
const UserController = require("../Controller/UserController");

// Validation
const {
    checkRegisterInput,
    checkLoginInput,
    checkForgotPasswordInput,
} = require("../Validation/UserDataRules");

const {
    inputValidationMiddleware,
} = require("../Validation/ValidationMiddleware");
const auth = require('../Middleware/auth')

// Authentication routes
AuthRouter.post("/logout", authenticateUser, UserController.logOut);
AuthRouter.get("/me", authenticateUser, UserController.getMe);

AuthRouter.post(
    "/register",
    checkRegisterInput,
    inputValidationMiddleware,
    UserController.addUser
);

AuthRouter.get("/verify/:token", UserController.verifyEmail); // Route pour activer l'utilisateur via email

AuthRouter.post(
    "/login",
    checkLoginInput,
    inputValidationMiddleware,
    UserController.loginUser
);

AuthRouter.post("/forgot", checkForgotPasswordInput, UserController.forgotPassword);
AuthRouter.post("/reset/:id/:token",  UserController.resetPassword);

/* Social Login */
AuthRouter.post("/google_login", UserController.googleLogin);

module.exports = AuthRouter;
