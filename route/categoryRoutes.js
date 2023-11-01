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
        const images = await Image.find({ category: req.params.id, user: req.params.user_id });

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


module.exports = router;