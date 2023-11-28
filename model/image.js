const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    image: Buffer,
    width: Number,
    height: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    histogram: {
        type: Buffer,
    },
    isHistogramProcessed: {
        type: Boolean,
        default: false,
    },
    palette: {
        type: Buffer,
    },
    isPaletteProcessed: {
        type: Boolean,
        default: false,
    },
    descriptor: {
        image_moments: {
            type: [Number],
        },
        image_tamura: {
            type: [Number],
        },
        image_gabor_filters: {
            type: [Number],
        },
    },
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;
