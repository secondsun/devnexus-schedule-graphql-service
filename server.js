const fs = require('fs')
const path = require('path')
const express = require('express')
const { KeycloakSecurityService } = require('@aerogear/voyager-keycloak')
const cors = require('cors')
const keycloakConfigPath = process.env.KEYCLOAK_CONFIG || path.resolve(__dirname, './config/keycloak.json')
const keycloakConfig = JSON.parse(fs.readFileSync(keycloakConfigPath))
const { VoyagerServer, gql } = require('@aerogear/voyager-server')

var data = {
};

// This is our Schema Definition Language (SDL)
const typeDefs = gql`

  type Feedback {
    sessionName: String!
    comment: String!
    score: Int!
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
      console.log(context.auth.isAuthenticated())
      console.log(context.auth.accessToken.content)
      
      if (!data[context.auth.accessToken.content.email]) {
        data[context.auth.accessToken.content.email] = {
          displayName: context.auth.accessToken.content.name,
          email: context.auth.accessToken.content.email,
          feedback: {}
        }
      }
      console.log(data);
      return data[context.auth.accessToken.content.email];
    }
  },
  Mutation: {
    createUser: (obj, args, context, info) => {
      return {"displayName":"Summers Hello World","email":"test@test.com"};
    },
    postFeedback: (obj, args, context, info) => {
      const {email}  = context.auth.accessToken.content;
      const {sessionName, comment, score} = args.feedback
      console.log(args);

      data[email].feedback[sessionName] = {
        comment: comment,
        score: score,
        sessionName:sessionName
      }

      return data[email].feedback[sessionName];
    }
  }
}

// Initialize the keycloak service
const keycloakService = new KeycloakSecurityService(keycloakConfig)

// The context is a function or object that can add some extra data
// That will be available via the `context` argument the resolver functions
const context = ({ req }) => {
  return {
    serverName: 'Voyager Server'
  }
}

// Initialize the voyager server with our schema and context

const apolloConfig = {
  typeDefs: [typeDefs, keycloakService.getTypeDefs()],
  resolvers,
  context
}

const voyagerConfig = {
  securityService: keycloakService
}

const server = VoyagerServer(apolloConfig, voyagerConfig)

const app = express()
app.use(cors())
// Apply the keycloak middleware to the express app.
// It's very important this is done before
// Applying the apollo middleware
// This function can also take an `options` argument
// To specify things like apiPath and tokenEndpoint
keycloakService.applyAuthMiddleware(app, { tokenEndpoint: true })
server.applyMiddleware({ app })

module.exports = { app, server }
