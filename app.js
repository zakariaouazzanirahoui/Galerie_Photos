require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const auth = require("./middleware/auth");
var cors = require('cors');


const app = express();
app.use(cors());


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

app.post("/login", async (req, res) => {

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

app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Hello World");
});

module.exports = app;