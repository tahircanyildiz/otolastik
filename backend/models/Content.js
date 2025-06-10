const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    siteTitle: {
        type: String,
        required: true,
        default: "OtoLastik Pro"
    },
    hero: {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    },
    services: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            default: 0
        }
    }],
    brands: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            default: 0
        }
    }],
    about: {
        text: {
            type: String,
            required: true
        },
        stats: [{
            number: String,
            label: String
        }]
    },
    contact: {
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        supportEmail: {
            type: String,
            required: true
        },
        workingHours: {
            weekdays: String,
            weekend: String
        }
    },
    socialLinks: {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String,
        linkedin: String
    },
    seoSettings: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Update lastUpdated on save
contentSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Content', contentSchema);