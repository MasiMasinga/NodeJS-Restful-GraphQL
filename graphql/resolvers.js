const User = require('../models/user');
const Post = require('../models/post');
const { GraphQLError } = require('graphql');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const resolvers = {
    Query: {
        async login(_, { email, password }, _context) {

            const user = await User.findOne({ email });
            if (!user) {
                throw new GraphQLError('User not found.');
            }

            const isEqual = await bcrypt.compare(password, user.password);
            if (!isEqual) {
                throw new GraphQLError('Password is incorrect.');
            }

            const token = jwt.sign({
                userId: user.id,
                email: user.email
            }, 'somesupersecretkey',
                { expiresIn: '1h' }
            );

            return { userId: user.id, token: token };
        }
    },

    Mutation: {
        async createUser(_, { userInput }, _context) {
            const errors = [];
            if (!validator.isEmail(userInput.email)) {
                errors.push({ message: 'E-Mail is invalid.' });
            };

            if (
                validator.isEmpty(userInput.password) ||
                !validator.isLength(userInput.password, { min: 5 })
            ) {
                errors.push({ message: 'Password too short!' });
            };

            if (errors.length > 0) {
                const error = new Error('Invalid input.');
                error.data = errors;
                error.code = 422;
                throw error;
            };

            const existingUser = await User.findOne({ email: userInput.email });
            if (existingUser) {
                throw new GraphQLError('User exists already.');
            };

            const hashedPw = await bcrypt.hash(userInput.password, 12);
            const user = new User({
                email: userInput.email,
                name: userInput.name,
                password: hashedPw,
            });

            const createdUser = await user.save();
            return { ...createdUser._doc, _id: createdUser._id.toString() };
        },

        async createPost(_, { postInput }, _context) {

            if (!req.isAuth) {
                const error = new Error('Not authenticated!');
                error.code = 401;
                throw error;
            };

            const errors = [];
            if (
                validator.isEmpty(postInput.title) ||
                !validator.isLength(postInput.title, { min: 5 })
            ) {
                errors.push({ message: 'Title is invalid.' });
            };

            if (
                validator.isEmpty(postInput.content) ||
                !validator.isLength(postInput.content, { min: 5 })
            ) {
                errors.push({ message: 'Content is invalid.' });
            };

            if (errors.length > 0) {
                const error = new Error('Invalid input.');
                error.data = errors;
                error.code = 422;
                throw error;
            };

            const user = await User.findById(req.userId);
            if (!user) {
                const error = new Error('Invalid user.');
                error.code = 401;
                throw error;
            };

            const post = new Post({
                title: postInput.title,
                content: postInput.content,
                imageUrl: postInput.imageUrl,
                creator: user,
            });

            const createdPost = await post.save();
            user.posts.push(createdPost);
            await user.save();

            return {
                ...createdPost._doc,
                _id: createdPost._id.toString(),
                createdAt: createdPost.createdAt.toISOString(),
                updatedAt: createdPost.updatedAt.toISOString(),
            };
        }
    },
};

module.exports = resolvers;