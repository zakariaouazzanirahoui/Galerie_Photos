const axios = require('axios');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Image = require('../model/image');

const flaskApiUrl = 'http://127.0.0.1:5000';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/search-images', upload.single('image'), async (req, res) => {
    try {
        const queryImage = req.file.buffer;

        const allImages = await getAllImagesFromDatabase(req);

        const similarImages = await searchImages(queryImage, allImages);

        const retrievedImages = await Image.find({ _id: { $in: similarImages } });

        res.status(200).json({ retrievedImages });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

async function searchImages(queryImage, allImages) {
    const formData = {
        queryImage: queryImage,
        allImagesData: [],
    };

    allImages.forEach((image) => {
        const { _id, descriptor } = image;

        // Check if image has descriptors
        if (descriptor && descriptor.image_moments && descriptor.image_tamura && Array.isArray(descriptor.image_tamura)) {
            formData.allImagesData.push({
                imageId: _id,
                descriptor: {
                    image_moments: descriptor.image_moments,
                    image_tamura: descriptor.image_tamura,
                    image_gabor_filters: descriptor.image_gabor_filters,
                },
            });
        }
    });

    try {
        const flaskResponse = await axios.post(`${flaskApiUrl}/search_images`, formData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const similarImages = flaskResponse.data.similar_images;

        return similarImages;
    } catch (error) {
        console.error('Error searching similar images:', error);
        throw error;
    }
}

async function getAllImagesFromDatabase(req) {
    try {
        // TODO : all operation
        const allImages = await Image.find({ user: req.user.user_id }).lean();

        return allImages;
    } catch (error) {
        console.error('Error fetching all images from the database:', error);
        throw error;
    }
}

module.exports = router;