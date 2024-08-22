const ApplicationModel = require("./../Model/ApplicationModel");
const UserModel = require("./../Model/UserModel");
const createError = require("http-errors");

exports.checkGuestApplications = async (req, res, next) => {
    // Vérifie si l'utilisateur n'est pas connecté (guest)
    if (!req.user) {
        try {
            // Recherche les applications existantes pour cet invité
            const guestApplications = await ApplicationModel.find({
                applicantId: req.body.applicantId, // Remplacer par le champ unique pour identifier l'invité (email, par exemple)
            });

            // Vérifie si le nombre d'applications est supérieur ou égal à 3
            if (guestApplications.length >= 3) {
                return res.status(403).json({
                    status: false,
                    message: "You have reached the maximum limit of applications as a guest. Please register to continue.",
                });
            }

            // Si le nombre d'applications est inférieur à 3, passe au middleware suivant
            next();
        } catch (error) {
            next(createError(500, error.message));
        }
    } else {
        // Si l'utilisateur est connecté, passe au middleware suivant
        next();
    }
};
