require("dotenv").config();
require("./config/database").connect();

const express = require("express");
const auth = require("./middleware/auth");
const cors = require('cors');

const userRoutes = require('./route/userRoutes');
const imageRoutes = require('./route/imageRoutes');
const categoryRoutes = require('./route/categoryRoutes');
const {router} = require('./route/flaskAPI');
const searchRoutes = require('./route/searchRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/user', userRoutes);

app.use(auth)

app.use('/image', imageRoutes);
app.use('/category', categoryRoutes);
app.use('/flask', router);
app.use('/search', searchRoutes);


module.exports = app;