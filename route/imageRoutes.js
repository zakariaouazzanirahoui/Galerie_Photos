const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const auth = require('../middleware/auth');
const Image = require('../model/image');
const router = express.Router();
const archiver = require('archiver');

const {processAndSaveImage} = require('./flaskAPI')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/get-image-by-id/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).send('Image not found');
        }

        if (image.user.toString() !== req.user.user_id) {
            return res.status(403).send('Access denied. You don’t have permission to view this image.');
        }


        res.status(200).json(image);

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/delete-image-by-id/:id', async (req, res) => {
    try {

        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).send('Image not found');
        }

        if (image.user.toString() !== req.user.user_id) {
            return res.status(403).send('Access denied. You don’t have permission to delete this image.');
        }

        await Image.findByIdAndRemove(req.params.id);
        res.status(200).send('Image deleted successfully');

    }catch (error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/download-image/:id', async (req, res) => {

    try {

        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).send('Image not found');
        }

        if (image.user.toString() !== req.user.user_id) {
            return res.status(403).send('Access denied. You don’t have permission to download this image.');
        }

        res.set('Content-Type', image.contentType);
        res.set('Content-Disposition', 'attachment; filename=' + image.filename);

        res.status(200).json(image);

    }catch (error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

})

router.post('/upload-multiple', upload.array('images'), async (req, res) => {
    try {
        const images = [];

        for (const file of req.files) {
            const metadata = await sharp(file.buffer).metadata();

            const processedImage = await processAndSaveImage(file.buffer, req, "descriptor");

            const newImg = new Image({
                filename: file.originalname,
                contentType: file.mimetype,
                image: file.buffer,
                width: metadata.width,
                height: metadata.height,
                user: req.user.user_id,
                category: req.body.categoryId,
                descriptor: processedImage
            });

            const savedImage = await newImg.save();
            images.push(savedImage);
        }

        res.status(200).json(images);

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

router.delete('/delete-images', async (req, res) => {
    try {
        const imageIds = req.body.imageIds;

        const isValidObjectIds = await Promise.all(imageIds.map(id => Image.findById(id)));

        if (!isValidObjectIds.every(image => image)) {
            return res.status(400).json({ message: 'Invalid image IDs' });
        }

        const deletedImages = await Image.deleteMany({ _id: { $in: imageIds }, user: req.user.user_id });

        res.status(200).json({ message: 'Images deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/download-images', async (req, res) => {
    try {
        const imageIds = req.body.imageIds;

        const isValidObjectIds = await Promise.all(imageIds.map(id => Image.findById(id)));

        if (!isValidObjectIds.every(image => image)) {
            return res.status(400).json({ message: 'Invalid image IDs' });
        }

        const images = await Image.find({ _id: { $in: imageIds } });

        for (const image of images) {
            if (image.user.toString() !== req.user.user_id) {
                return res.status(403).json({ message: 'Access denied. You don’t have permission to download one or more images.' });
            }
        }

        const zip = archiver('zip', {
            zlib: { level: 9 }
        });

        res.attachment('images.zip');
        zip.pipe(res);

        for (const image of images) {
            zip.append(image.image, { name: image.filename });
        }

        zip.finalize();

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// TODO
router.post('/search-images', async (req, res) => {
    try {
        // Get the descriptor from the request
        const queryDescriptor = req.body.queryDescriptor;

        // Perform a search based on the query descriptor
        const resultImages = await  Image.find({
            // Example: Search based on histogram descriptor
            'histogram': queryDescriptor.histogram,
        });

        res.status(200).json(resultImages);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


module.exports = router;
