const axios = require('axios');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Image = require('../model/image');
const crypto = require('crypto');

const flaskApiUrl = 'http://127.0.0.1:5000';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/category/:id/user/:user_id/process-image/:id', upload.single('imageBuffer'), async (req, res) => {

    try{

        const { id } = req.params;
        const image = await Image.findById(id);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const selectedOperation = req.body.operation; // 'resize', 'crop', etc.

        const formData = {
            image: image.image,
            new_width: req.body.new_width,
            new_height: req.body.new_height,
        };

        const flaskResponse = await axios.post(`${flaskApiUrl}/process_image/${selectedOperation}`, formData, {
            headers: {
                'Content-Type': "application/json",
            },
        });

        // Save the processed image as a new document in the database
        const processedImageData = flaskResponse.data.processed_image_data;
        console.log(processedImageData)
        console.log(typeof processedImageData);

        const uniqueFilename = generateUniqueFilename();

        const processedImage = new Image({
            filename: uniqueFilename,
            contentType: processedImageData.contentType, // Adjust the content type as needed
            image: Buffer.from(processedImageData, 'base64'), // Remove the 'base64' conversion
            user: req.params.user_id,
            category: req.params.id,
        });

        const savedProcessedImage = await processedImage.save();

        res.status(200).json(processedImage);

    }catch (error){
        console.error(error);
        res.status(500).send('Internal server error');
    }

});

// Function to generate a unique filename
function generateUniqueFilename() {
    const timestamp = new Date().getTime();
    const randomString = crypto.randomBytes(5).toString('hex'); // Generates a random hex string
    return `${timestamp}-${randomString}.jpg`;
}


module.exports = router;