const User = require("../model/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const Category = require("../model/category");
const Image = require("../model/image");
const auth = require("../middleware/auth");

const express = require("express");
const router = express.Router();

router.post("/register", async (req, res) => {
    let encryptedPassword;
    try {
        const {username, password} = req.body;

        // username and password required
        if (!(username && password)) {
            res.status(400).send("All input is required");
        }

        // check if user exists
        const oldUser = await User.findOne({username});
        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        // encrypt password
        encryptedPassword = await bcrypt.hash(password, 10);

        // create the user
        const user = await User.create({
            username,
            password: encryptedPassword,
        });

        const token = jwt.sign(
            { user_id: user._id },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );
        user.token = token;

        res.status(201).json(user);

    } catch (err) {
        console.log(err);
    }
});

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;
        if (!(username && password)) {
            res.status(400).send("All input is required");
        }

        // check if user exists
        const user = await User.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {

            const token = jwt.sign(
                {user_id: user._id},
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );

            user.token = token;

            return res.status(200).json(user);
        }
        return res.status(400).send("Invalid Credentials");

    }catch (err){
        console.log(err);
    }

});

router.get('/:user_id/category-count', auth, async (req, res) => {
    try {
        const userCategoriesCount = await Category.countDocuments({ user: req.params.user_id });

        res.status(200).json({ categoryCount: userCategoriesCount });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

router.get('/:user_id/image-count', auth, async (req, res) => {
    try {
        const userImagesCount = await Image.countDocuments({ user: req.params.user_id });

        res.status(200).json({ imageCount: userImagesCount });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;