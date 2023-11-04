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

router.post('/process-image/:id', auth, async (req, res) => {

    try{

        const { id } = req.params;
        const image = await Image.findById(id) .populate('user').populate('category'); 
        const category_id =image.category._id.toString();
        const user_id = image.user._id.toString();

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const selectedOperation = req.body.operation;

        if (selectedOperation !== "resize" && selectedOperation !== "crop"){
            if (image.get(selectedOperation)){
                res.status(200).json(image[selectedOperation]);
            }else {

                const processedImageData = await processAndSaveImage(image, req, selectedOperation);

                if (selectedOperation === "color_moments"){

                    const color_moments = {
                        color_moments:
                            {
                                type: [Number],
                            },

                    };
                    Image.schema.add(color_moments);

                    await Image.findByIdAndUpdate(
                        id,
                        { [selectedOperation]: processedImageData },
                        { new: true }
                    );

                    res.status(200).json(processedImageData);
                }else{
                    const bufferImage = Buffer.from(processedImageData, 'base64');

                    const updatedImage = await Image.findByIdAndUpdate(
                        id,
                        { [selectedOperation]: bufferImage },
                        { new: true }
                    );

                    console.log(updatedImage)

                    res.status(200).json(bufferImage);
                }
            }

        } else{

            const processedImageData = await processAndSaveImage(image, req, selectedOperation);
            const bufferImage = Buffer.from(processedImageData, 'base64');

            const uniqueFilename = generateUniqueFilename();

            let processedImage = new Image({
                filename: uniqueFilename,
                contentType: processedImageData.contentType,
                image: bufferImage,
                user: user_id,
                category: category_id,
            });

            const savedProcessedImage = await processedImage.save();

            res.status(200).json(savedProcessedImage);

        }

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

async function processAndSaveImage(image, req, selectedOperation) {
    const formData = {
        image: image.image,
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


module.exports = router;