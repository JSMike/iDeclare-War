// config/auth.js

var externalAuth = {
  'facebookAuth': {
    'clientID': 'YourAppIDHere',
    'clientSecret': 'YourSecretHere',
    'callbackURL': "http://localhost:3000/auth/facebook/callback"
  },
  'twitterAuth': {
    'consumerKey': 'YourAppIDHere',
    'consumerSecret': 'YourSecretHere',
    'callbackURL': 'http://127.0.0.1:3000/auth/twitter/callback'
  },
  'googleAuth': {
    'clientID': 'YourAppIDHere',
    'clientSecret': 'YourSecretHere',
    'callbackURL': 'http://localhost:3000/auth/google/callback'
  }
};

module.exports = externalAuth;
