var jwt = require('jsonwebtoken');

const {
    execute,
    subscribe
  } = require('graphql')
  const { PubSub } = require('apollo-server');
  const { SubscriptionServer } = require('subscriptions-transport-ws')
  
  function subscriptionServer (keycloakService, httpServer, apolloServer) {
      return new SubscriptionServer({
        execute,
        subscribe,
        onConnect: async connectionParams => {
          if(keycloakService) {
            value =  await keycloakService.validateToken(connectionParams)
            console.log("Login onConnect"); 
            if (!value) {
              console.log("Login failed"); 
              return false;
            }
            
            
            var decoded = jwt.decode(connectionParams);
            console.log("decoded payload"); 
            console.log(decoded); 
            return {auth:decoded}
          } else {
            return false;
          }
        },
        schema: apolloServer.schema
      }, {
        server: httpServer,
        path: '/graphql'
      });
  }
  
  module.exports = {
      pubSub: new PubSub(),
      subscriptionServer
  }