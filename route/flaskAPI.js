const axios = require('axios');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Image = require('../model/image');
const crypto = require('crypto');
const sharp = require("sharp");

const flaskApiUrl = 'http://127.0.0.1:5000';
//const flaskApiUrl = 'http://74.234.201.105:5000';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function processAndSaveImages(imageIds, selectedOperation, req) {
    try {
        const processedImageData = [];

        for (const imageId of imageIds) {
            const image = await Image.findById(imageId).populate('user').populate('category');
            const category_id = image.category ? image.category._id.toString() : null;
            const user_id = image.user._id.toString();

            if (!image) {
                return res.status(404).json({ message: 'Image not found' });
            }

            if (selectedOperation !== 'resize' && selectedOperation !== 'crop') {
                if (image[`is${selectedOperation.charAt(0).toUpperCase()}${selectedOperation.slice(1)}Processed`]){
                    processedImageData.push(image[selectedOperation]);
                } else {

                    switch (selectedOperation) {
                        case 'histogram':
                            image.isHistogramProcessed = true;
                            break;
                        case 'palette':
                            image.isPaletteProcessed = true;
                            break;
                        // TODO: add other cases
                    }
                    await image.save();

                    const processedImage = await processAndSaveImage(image.image, req, selectedOperation);

                    if (selectedOperation === "color_moments"){

                        await Image.findByIdAndUpdate(
                            imageId,
                            { [selectedOperation]: processedImage },
                            { new: true }
                        );

                        processedImageData.push(processedImage);
                    }else{
                        const bufferImage = Buffer.from(processedImage, 'base64');

                        const updatedImage = await Image.findByIdAndUpdate(
                            imageId,
                            { [selectedOperation]: bufferImage },
                            { new: true }
                        );

                        processedImageData.push(bufferImage);
                    }
                }
            } else {

                const processedImage = await processAndSaveImage(image.image, req, selectedOperation);

                const bufferImage = Buffer.from(processedImage, 'base64');
                const uniqueFilename = generateUniqueFilename();

                const { width, height } = await sharp(bufferImage).metadata();

                let processedImageDocument = new Image({
                    filename: uniqueFilename,
                    contentType: 'image/jpg',
                    image: bufferImage,
                    width: width,
                    height: height,
                    user: user_id,
                    category: category_id,
                });

                const savedProcessedImage = await processedImageDocument.save();

                processedImageData.push(savedProcessedImage);
            }
        }

        return processedImageData;
    } catch (error) {
        console.error('Error processing and saving images:', error);
        throw error;
    }
}

router.post('/process-images', auth, upload.array('images'), async (req, res) => {
    try {
        const imageIds = req.body.imageIds;

        const processedImageData = await processAndSaveImages(imageIds, req.body.operation, req);

        res.status(200).json({ imageIds, processedImageData });
    } catch (error) {
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

async function processAndSaveImage(image, req, selectedOperation) {
    const formData = {
        image: image,
        new_width: req.body.new_width,
        new_height: req.body.new_height,
        start_x: req.body.start_x,
        start_y: req.body.start_y,
        end_x: req.body.end_x,
        end_y: req.body.end_y,
    };

    try {
        const flaskResponse = await axios.post(`${flaskApiUrl}/process_image/${selectedOperation}`, formData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const processedImageData = flaskResponse.data.processed_image_data;

        return processedImageData;
    } catch (error) {
        console.error('Error processing and saving image:', error);
        throw error;
    }
}


module.exports = {router, processAndSaveImage};