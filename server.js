const { subscriptionServer } = require('./subscriptions')
const http = require('http')
const fs = require('fs')
const path = require('path')
const express = require('express')
const { KeycloakSecurityService } = require('@aerogear/voyager-keycloak')
const cors = require('cors')
const keycloakConfigPath = process.env.KEYCLOAK_CONFIG || path.resolve(__dirname, './config/keycloak.json')
const keycloakConfig = JSON.parse(fs.readFileSync(keycloakConfigPath))
const { VoyagerServer, gql } = require('@aerogear/voyager-server')
const { PubSub, withFilter } = require('apollo-server');

const pubsub = new PubSub();

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
    feedback: [Feedback!]!
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

  type Subscription {
    userActivity : User!
  }

`

// Resolver functions. This is our business logic
const resolvers = {
  Query: {
    me: (obj, args, context, info) => {
      
      if (!data[context.auth.accessToken.content.email]) {
        data[context.auth.accessToken.content.email] = {
          displayName: context.auth.accessToken.content.name,
          email: context.auth.accessToken.content.email,
          feedback: {}
        }
      }
      
      var user = {};
      user.displayName = data[context.auth.accessToken.content.email].displayName;
      user.email = data[context.auth.accessToken.content.email].email;
      user.feedback = Object.values(data[context.auth.accessToken.content.email].feedback);

      return user;
    }
  },
  Mutation: {
    createUser: (obj, args, context, info) => {
      return {"displayName":"Summers Hello World","email":"test@test.com"};
    },
    postFeedback: (obj, args, context, info) => {
      const {email}  = context.auth.accessToken.content;
      const {sessionName, comment, score} = args.feedback
      
      data[email].feedback[sessionName] = {
        comment: comment,
        score: score,
        sessionName:sessionName
      }

      var user = {};
      user.displayName = data[context.auth.accessToken.content.email].displayName;
      user.email = data[context.auth.accessToken.content.email].email;
      user.feedback = Object.values(data[context.auth.accessToken.content.email].feedback);

      pubsub.publish('USER_ACTIVITY', { userActivity: user });
      return data[email].feedback[sessionName];
    }
  },

  Subscription: {
    userActivity: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('USER_ACTIVITY'),
        (payload, variables, context) => {
          console.log("payload")
          console.log(payload)
          if (!payload) {
            return false;
          }
         return payload.userActivity.email === context.auth.email;
        },
      ),
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


const app = express()
const httpServer = http.createServer(app)
app.use(cors())
// Apply the keycloak middleware to the express app.
// It's very important this is done before
// Applying the apollo middleware
// This function can also take an `options` argument
// To specify things like apiPath and tokenEndpoint
keycloakService.applyAuthMiddleware(app, { tokenEndpoint: true })


const apolloServer = VoyagerServer(apolloConfig, voyagerConfig)

  apolloServer.applyMiddleware({
    app
  })
  httpServer.listen({
    port: 4000
  }, () => {
    console.log(`🚀  Server ready at http://localhost:4000/graphql`)
    subscriptionServer(keycloakService, httpServer, apolloServer)
  })

module.exports = { app, httpServer,  apolloServer}
