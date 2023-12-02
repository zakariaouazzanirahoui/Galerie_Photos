const mongoose = require('mongoose');

const weightsSchema = new mongoose.Schema({
    weights: {
        type: [Number],
        default: [1, 1],
    },
});

const Weights = mongoose.model('Weights', weightsSchema);
module.exports = Weights;
