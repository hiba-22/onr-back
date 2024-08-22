const mongoose = require("mongoose");

const PendingUserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        location: {
            type: String,
        },
        gender: {
            type: String,
        },
        role: {
            type: String,
            enum: ["admin", "recruiter", "user", "guest"],
            default: "user",
        },
        resume: {
            type: String,
        },
        verificationToken: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

const PendingUserModel = mongoose.model("PendingUser", PendingUserSchema);
module.exports = PendingUserModel;
