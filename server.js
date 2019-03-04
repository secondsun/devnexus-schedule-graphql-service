const fs = require('fs')
const path = require('path')
const express = require('express')

const { VoyagerServer, gql } = require('@aerogear/voyager-server')

// This is our Schema Definition Language (SDL)
const typeDefs = gql`

  type Feedback {
    sessionName: String!
    comment: String!
    score: Int!
    user: User!
  }

  type User {
    displayName: String!
    email: String!
  }

  input UserInput {
    displayName: String!
    email: String!
  }

input FeedbackInput {
  sessionName: String!
    comment: String!
    score: Int!
}

  type Query {
    me:User
  }

  type Mutation {
    createUser(user : UserInput!): User!
    postFeedback(feedback : FeedbackInput!) : Feedback!
  }

`

// Resolver functions. This is our business logic
const resolvers = {
  Query: {
    me: (obj, args, context, info) => {
      return {"displayName":"Summers Hello World","email":"test@test.com"};
    }
  },
  Mutation: {
    createUser: (obj, args, context, info) => {
      return {"displayName":"Summers Hello World","email":"test@test.com"};
    },
    postFeedback: (obj, args, context, info) => {
      return {"comment":"This is a test comment", "score":5, "sessionName":"This is a test session", "user":{"displayName":"Summers Hello World","email":"test@test.com"}};
    }
  }
}

// Initialize the keycloak service
//const keycloakService = new KeycloakSecurityService(keycloakConfig)

// The context is a function or object that can add some extra data
// That will be available via the `context` argument the resolver functions
const context = ({ req }) => {
  return {
    serverName: 'Voyager Server'
  }
}

// Initialize the voyager server with our schema and context

const apolloConfig = {
  typeDefs: [typeDefs],
  resolvers,
  context
}

const voyagerConfig = {
}

const server = VoyagerServer(apolloConfig, voyagerConfig)

const app = express()

// Apply the keycloak middleware to the express app.
// It's very important this is done before
// Applying the apollo middleware
// This function can also take an `options` argument
// To specify things like apiPath and tokenEndpoint
//keycloakService.applyAuthMiddleware(app, { tokenEndpoint: true })
server.applyMiddleware({ app })

module.exports = { app, server }
