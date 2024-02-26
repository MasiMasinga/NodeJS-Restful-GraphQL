const { validationResult } = require('express-validator/check');
const path = require('path');
const fs = require('fs');
const Post = require('../models/post');
const User = require('../models/user');

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};

exports.getPosts = async (req, res, next) => {

    const currentPage = req.query.page || 1;
    const perPage = 2;

    try {

        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find().skip((currentPage - 1) * perPage).limit(perPage);

        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            totalItems: totalItems
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        };
        next(err);
    };
};

exports.getPost = async (req, res, next) => {

    try {

        const post = await Post.findById(req.params.postId);

        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        };

        res.status(200).json({
            message: 'Post fetched.',
            post: post
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        };
        next(err);
    };

};

exports.createPost = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    };

    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    };

    let creator;

    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        imageUrl: req.file.path,
        creator: req.userId
    });

    try {

        await post.save();

        const user = await User.findById(req.userId);
        creator = user;
        user.posts.push(post);

        await user.save();

        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: { _id: creator._id, name: creator.name }
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        };
        next(err);
    };

};

exports.updatePost = async (req, res, next) => {
    let imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path;
    };

    if (!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    };

    try {

        const post = await Post.findById(req.params.postId);

        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        };

        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized.');
            error.statusCode = 403;
            throw error;
        };

        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        };

        post.title = req.body.title;
        post.content = req.body.content;
        post.imageUrl = imageUrl;

        await post.save();

        res.status(200).json({
            message: 'Post updated!',
            post: post
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        };
        next(err);
    }
};

exports.deletePost = async (req, res, next) => {
    try {

        const post = await Post.findById(req.params.postId);

        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        };

        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        };

        clearImage(post.imageUrl);

        await Post.findByIdAndRemove(req.params.postId);

        const user = await User.findById(req.userId);
        user.posts.pull(req.params.postId);
        await user.save();

        res.status(200).json({ message: 'Deleted post.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        };
        next(err);
    };
};