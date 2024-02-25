const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
require('dotenv').config()

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'images');
    },
    filename: function (_req, file, cb) {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (_req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

app.use(bodyParser.json());
app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'));
app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((error, _req, res, _next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});

mongoose.connect(process.env.MONGO_URI).then(_result => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Nodejs Restful GraphQL 🚀Server Started on PORT ${process.env.PORT}`);
    });
}).catch(
    err => console.log(err)
);
