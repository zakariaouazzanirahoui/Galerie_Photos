const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const auth = require('../middleware/auth');
const Image = require('../model/image');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        const metadata = await sharp(req.file.buffer).metadata();

        let newImg = new Image({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            image: req.file.buffer,
            width: metadata.width,
            height: metadata.height,
            user: req.user.user_id,
            category: req.body.categoryId
        });

        const savedImage = await newImg.save();
        res.status(200).json(newImg);
        //res.status(200).json({ message: "Image uploaded successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});


router.get('/get-image-by-id/:id', auth, async (req, res) => {
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

router.delete('/delete-image-by-id/:id', auth, async (req, res) => {
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

router.get('/download-image/:id', auth, async (req, res) => {

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


module.exports = router;
