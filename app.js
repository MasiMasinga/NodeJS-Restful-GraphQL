const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const { ApolloServer } = require('apollo-server');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const authMiddleware = require('./middleware/auth');

require('dotenv').config();

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

app.put('/post-image', (req, res, _next) => {
    if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
    };
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided!' });
    };
    if (req.body.oldPath) {
        clearImage(req.body.oldPath);
    };
    return res.status(201).json({ message: 'File stored.', filePath: req.file.path });
})

app.use(authMiddleware);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => {
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
    }
});

async function startApolloServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        const res = await server.listen({ port: 5002 });
        console.log(`Nodejs Restful GraphQL 🚀 Server running at ${res.url}`);
    } catch (error) {
        console.log(error);
    }
};

startApolloServer();

// RESTFUL API SERVER
// mongoose.connect(process.env.MONGO_URI).then(_result => {
//     const server = app.listen(process.env.PORT || 3000, () => {
//         console.log(`Nodejs Restful GraphQL 🚀Server Started on PORT ${process.env.PORT}`);
//     });
//     const io = require('./socket').init(server);
//     io.on('connection', socket => {
//         console.log('Client connected');
//     });
// }).catch(
//     err => console.log(err)
// );
