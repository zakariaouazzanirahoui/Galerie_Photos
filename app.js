require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const auth = require("./middleware/auth");
var cors = require('cors');

const userRoutes = require('./route/userRoutes');
const imageRoutes = require('./route/imageRoutes');

const app = express();
app.use(cors());


app.use(express.json());

app.use('/user', userRoutes);
app.use('/image', imageRoutes);


module.exports = app;