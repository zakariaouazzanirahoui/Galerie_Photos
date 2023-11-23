const express = require("express");
const Category = require("../model/category");
const Image = require("../model/image");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/add-category", auth, async (req, res) => {

    try {

        const {categoryName} = req.body;

        // check if category exists
        const oldCategory = await Category.findOne({ categoryName: categoryName });
        if (oldCategory) {
            return res.status(409).send("Category Already Exist. Try another category name");
        }

        const category = await Category.create({
            categoryName,
            user: req.user.user_id,
        });

        res.status(201).json(category);

    }catch (err){
        console.log(err)
    }

})


router.get('/get-category-by-id/:id/user/:user_id/images', auth, async (req, res) => {
    try {
        const images = await Image.find({ category: req.params.id, user: req.params.user_id })
            .sort({ createdAt: -1 });

        res.status(200).json(images);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

router.get('/get-category-by-user/:user_id', auth,async (req, res) => {
    try {
        const categories = await Category.find({ user: req.params.user_id });

        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

router.delete('/delete-category-by-id/:id', auth, async (req, res) => {
    try {

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send('Category not found');
        }

        if (category.user.toString() !== req.user.user_id) {
            return res.status(403).send('Access denied. You don’t have permission to delete this category.');
        }

        await Image.deleteMany({ category: req.params.id });

        await Category.findByIdAndRemove(req.params.id);
        res.status(200).send('Category deleted successfully');

    }catch (error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})


module.exports = router;