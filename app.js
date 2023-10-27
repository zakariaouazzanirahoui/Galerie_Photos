require("dotenv").config();
require("./config/database").connect();
const express = require("express");

const app = express();

app.use(express.json());

const User = require("./model/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');


app.post("/register", async (req, res) => {
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

        // Create token
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

app.post("/login", (req, res) => {

});

module.exports = app;