const { gql } = require('apollo-server-express');

const typeDefs = gql`

    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        email: String!
        name: String!
        password: String
        status: String!
        post: [Post!]!
    }

    type AuthData {
        userId: ID!
        token: String!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    type Query {
        login(email: String!, password: String!): AuthData!
    }
    
    type Mutation {
        createUser(userInput: UserInputData): User!
    }
`;

module.exports = typeDefs;