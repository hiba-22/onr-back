const { check } = require("express-validator");


exports.checkArticleInput = [
    check("titre").trim().notEmpty().withMessage("Article must have a Titre"),
    check("description").trim().notEmpty().withMessage("Article Description is requried"),
    check("services").isArray({ min: 1 }).withMessage("Article Services is requrie"),
    check("community")
        .isArray({ min: 1 })
        .withMessage("Article Community is requrie"),
    check("references")
        .isArray({ min: 1 })
        .withMessage("Article References is requrie"),
    
];
