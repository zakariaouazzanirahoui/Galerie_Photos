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

router.post('/process-image/:id', auth, upload.single('imageBuffer'), async (req, res) => {

    try{

        const { id } = req.params;

        // Retrieve the image data (buffer) from the database using the image ID
        const image = await Image.findById(id);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const selectedOperation = req.body.operation; // 'resize', 'crop', etc.

        const imageBase64 = image.toString('base64');

        // Prepare the data to send to the Flask server
        const formData = {
            image: imageBase64,
            new_width: req.body.new_width,
            new_height: req.body.new_height,
        };

        console.log(formData)

        // Send an HTTP POST request to Flask for image processing
        const flaskResponse = await axios.post(`${flaskApiUrl}/process_image/${selectedOperation}`, formData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Handle the response from Flask
        // Save the processed image as a new document in the database
        const processedImageData = flaskResponse.data;
        console.log("processedImageData", processedImageData)

        // Generate a unique filename for the processed image
        const uniqueFilename = generateUniqueFilename();

        // Create a new Image instance for the processed image
        const processedImage = new Image({
            filename: uniqueFilename,
            contentType: 'image/jpeg',
            image: Buffer.from(processedImageData, 'base64'),
            user: req.user.user_id,
            category: req.body.categoryId
        });

        // Save the processed image to the database
        const savedProcessedImage = await processedImage.save();

        res.status(200).json(processedImage);

    }catch (error){
        console.error(error);
        res.status(500).send('Internal server error');
    }

});

// Function to generate a unique filename using a timestamp and random string
function generateUniqueFilename() {
    const timestamp = new Date().getTime();
    const randomString = crypto.randomBytes(5).toString('hex'); // Generates a random hex string
    return `${timestamp}-${randomString}.jpg`;
}


module.exports = router;