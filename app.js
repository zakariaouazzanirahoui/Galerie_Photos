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

app.use((req, res, next) => {

    const excludedRoutePattern = /^\/category\/get-category-by-id\/\w+\/user\/\w+\/images$/;
    if (excludedRoutePattern.test(req.path)) {
        next();
        return;
    }

    const originalSend = res.send;

    res.send = function (body) {
        console.log(`Response for ${req.method} ${req.url}:`, body);
        originalSend.apply(res, arguments);
    };

    next();
});


app.use('/user', userRoutes);

app.use(auth)

app.use('/image', imageRoutes);
app.use('/category', categoryRoutes);
app.use('/flask', router);
app.use('/search', searchRoutes);


module.exports = app;