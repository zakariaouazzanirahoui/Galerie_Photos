const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    image: Buffer,
    width: Number,
    height: Number,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;