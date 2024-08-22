const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
    titre: {
        type: String,
        trim: true,
        required: [true, "A titre  is requried"],
        minLength: [5, "titre is too short"],
        maxLength: [100, "titre is too long"],
    },
    description: {
        type: String,
        requried: [true, "Job Description is requried"],
        trim: true,
    },
    services: {
        type: [],
        requried: [true, "services is requried"],
        trim: true,
        // minLength: [5, "Company name is too short"],
        // maxLength: [100, "Company name is too long"],
    },
    community: {
        type: [],
        requried: [true, "community is requried"],
        trim: true,
        // minLength: [5, "Company name is too short"],
        // maxLength: [100, "Company name is too long"],
    },
    references: {
        type: [],
        requried: [true, "community is requried"],
        trim: true,
        // minLength: [5, "Company name is too short"],
        // maxLength: [100, "Company name is too long"],
    },
    
    images: [{
        type: String,
        required: true
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
       
    }
    },
    { timestamps: true });

    articleSchema.pre('findOneAndUpdate', function(next) {
        const update = this.getUpdate();
        
        if (update.isPublished) {
            update.publishedAt = Date.now();
            console.log("Pre-findOneAndUpdate hook: publishedAt set to", update.publishedAt);
        } else {
            update.publishedAt = null;
            console.log("Pre-findOneAndUpdate hook: publishedAt reset to null");
        }
        
        next();
    });
    
module.exports = mongoose.model('Article', articleSchema);
