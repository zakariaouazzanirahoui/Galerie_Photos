const express = require("express");
const Category = require("../model/category");
const Image = require("../model/image");
const router = express.Router();

router.post("/add-category", async (req, res) => {

    try {

        const {categoryName} = req.body;

        // check if category exists
        const oldCategory = await Category.findOne({ categoryName: categoryName });
        if (oldCategory) {
            return res.status(409).send("Category Already Exist. Try another category name");
        }

        const category = await Category.create({
            categoryName,
        });

        res.status(201).json(category);

    }catch (err){
        console.log(err)
    }

})


router.get('/get-category-by-id/:id/images', async (req, res) => {
    try {
        const images = await Image.find({ category: req.params.id });

        res.status(200).json(images);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});


module.exports = router;