const express = require('express');
const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/posts', auth, feedController.getPosts);

router.get('/post/:postId', auth, feedController.getPost);

router.post('/post', [
    body('title')
        .trim()
        .isLength({ min: 5 }),
    body('content')
        .trim()
        .isLength({ min: 5 })],
    auth,
    feedController.createPost
);

router.put('/post/:postId', [
    body('title')
        .trim()
        .isLength({ min: 5 }),
    body('content')
        .trim()
        .isLength({ min: 5 })],
    auth,
    feedController.updatePost
);

router.delete('/post/:postId', auth, feedController.deletePost);

module.exports = router;