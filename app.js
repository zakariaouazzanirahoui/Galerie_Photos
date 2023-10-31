require("dotenv").config();
require("./config/database").connect();

const express = require("express");

const userRoutes = require('./route/userRoutes');
const imageRoutes = require('./route/imageRoutes');
const categoryRoutes = require('./route/categoryRoutes');
const flaskRoutes = require('./route/flaskAPI');

const app = express();

app.use(express.json());

app.use('/user', userRoutes);
app.use('/image', imageRoutes);
app.use('/category', categoryRoutes);
//app.get('/flask', flaskRoutes.getFlaskData);


module.exports = app;