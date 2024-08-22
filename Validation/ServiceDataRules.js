const { check } = require("express-validator");


exports.checkServiceInput = [
    check("titre").trim().notEmpty().withMessage("Service must have a Titre"),
    check("description").trim().notEmpty().withMessage("Service Description is requried"),
    check("services").isArray({ min: 1 }).withMessage("Service Services is requried"),
    check("principaux_outils_experts").isArray({ min: 1 }).withMessage("principaux_outils_experts Services is requried"),
    check("community")
        .isArray({ min: 1 })
        .withMessage("Service Community is requried"),
    check("references")
        .isArray({ min: 1 })
        .withMessage("Service References is requried"),
    
];
