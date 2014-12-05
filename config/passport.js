/**
 * /config/passport.js
 **/

//includes
var validator = require('validator');

//Strategies
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//Variables for each Strategy
var configAuth = require('./auth');

//Mongoose User Model
var User = require('./models/user');

var YouShallNotPass = function(passport) {
  /**
   * Session Setup
   **/

  //serialize user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  //deserialize user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  /**
   * Local Signup
   **/

  passport.use('local-signup', new LocalStrategy({
    //by default LocalStrategy users username/password
    //overriding with email/password
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    process.nextTick(function() {
      User.findOne({ 'local.email': email }, function(err,user) {
        if (err)
          return done(err);

        if (user) {
          //console.log('setting flash mesage.');
          return done(null, false, req.flash('message', 'That email address is already registered.'));
        } else if (!validator.isEmail(email)) {
          return done(null, false, req.flash('message', 'Please use a valid e-mail address.'));
        } else {
          // if no user has this e-mail, create user with unique username

          //split username off of e-mail
          var username = email.split('@')[0];

          //see if this username already exists
          User.findOne( {'username': username}, function(err, exists) {
            if (err) {
              return done(err);
            }
            if (exists === null) {
              //username doesn't exist, add user with username from e-mail
              var newUser = new User();
              newUser.username = username;
              newUser.local.email = email;
              newUser.local.password = newUser.generateHash(password);
              newUser.save(function (err) {
                if (err) {
                  return done(err);
                }
                  return done(null, newUser);
              });
            } else {
              //user does exist, find username with highest number next to it and add 1

              User.find({username: {$regex : '^' + username + '[0-9]*$', $options: 'i'}},{_id: 0, username:1})
                  .sort({username: -1})
                  .limit(1)
                  .exec(function(err, highest) {
                  if (err) {
                    return done(err);
                  }
                  username = username + (Number(highest[0].username.split(username)[1] || 0) + 1);

                  var newUser = new User();
                  newUser.username = username;
                  newUser.local.email = email;
                  newUser.local.password = newUser.generateHash(password);
                  newUser.save(function (err) {
                    if (err) {
                      throw err;
                    }
                    return done(null, newUser);
                  });
              });
            }
          });
        }
      });
    });
  }));

  /**
   * Local Login
   **/
  passport.use('local-login', new LocalStrategy({
    //by default LocalStrategy users username/password
    //overriding with email/password
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {

    User.findOne({ 'local.email': email }, function(err,user) {
      if (err)
        return done(err);

      if (!user) {
        //user doesn't exist
        console.log('setting flash mesage.');
        return done(null, false, req.flash('message', 'No user found.'));
      } else if (!user.validPassword(password)){
        //invalid password
        console.log('setting flash mesage.');
        return done(null, false, req.flash('message', 'The password you\'ve entered is incorrect.'));
      } else {
        //successful login
        return done(null, user);
      }
    });

  }));

  /**
   * Facebook
   **/
  passport.use(new FacebookStrategy({
    //use credentials from auth.js
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    passReqToCallback: true // lets us check if user is logged in
  },

  // Facebook will send back the token and profile
  function(req, token, refreshToken, profile, done) {
    process.nextTick(function() {
      //if user isn't logged in
      if (!req.user) {
        //console.log(JSON.stringify(profile, null ,2));
        User.findOne({ 'facebook.id': profile.id },
            function(err, user) {
          if (err) {
            return done(err);
          } else if (user) {
            return done(null, user);
          } else {
            // user doesn't exist, create user with unique username

            //split username off of e-mail
            var username = profile._json.email.split('@')[0];

            //see if this username already exists
            User.findOne( {'username': username}, function(err, exists) {
              if (err) {
                return done(err);
              }
              if (exists === null) {
                //username doesn't exist, add user with username from e-mail
                var newUser = new User();

                newUser.username = username;
                newUser.facebook.id = profile._json.id;
                newUser.facebook.token = token;
                newUser.facebook.name = profile._json.name;
                newUser.facebook.email = profile._json.email;

                newUser.save(function (err) {
                  if (err) {
                    return done(err);
                  }
                  return done(null, newUser);
                });
              } else {
                //user does exist, find username with highest number next to it and add 1

                User.find({username: {$regex : '^' + username + '[0-9]*$', $options: 'i'}},{_id: 0, username:1})
                .sort({username: -1})
                .limit(1)
                .exec(function(err, highest) {
                  if (err) {
                    return done(err);
                  }
                  username = username + (Number(highest[0].username.split(username)[1] || 0) + 1);

                  var newUser = new User();

                  newUser.username = username;
                  newUser.facebook.id = profile._json.id;
                  newUser.facebook.token = token;
                  newUser.facebook.name = profile._json.name;
                  newUser.facebook.email = profile._json.email;

                  newUser.save(function (err) {
                    if (err)
                      throw err;
                    });
                });
              }
            });
          }
        });
      } else {
        //user is logged in, see if Facebook account exists in database
        User.findOne({ 'facebook.id': profile.id },
        function(err, user) {
          if (err) {
            return done(err);
          } else if (user) {
            return done(null, false, req.flash('message', 'This Facebook account is already linked to a different user account.'));
          } else {
            //facebook account doesn't exist
            //add link to account
            var linkuser = req.user;
            linkuser.facebook.id = profile._json.id;
            linkuser.facebook.token = token;
            linkuser.facebook.name = profile._json.name;
            linkuser.facebook.email = profile._json.email;

            linkuser.save(function(err) {
              if (err)
                throw err;
              return done(null, user);
            });
          }
        });
      }
    });
  }));

  /**
   * Twitter
   **/
  passport.use(new TwitterStrategy({
    consumerKey: configAuth.twitterAuth.consumerKey,
    consumerSecret: configAuth.twitterAuth.consumerSecret,
    callbackURL: configAuth.twitterAuth.callbackURL,
    passReqToCallback: true // lets us check if user is logged in
  }, function (req, token, tokenSecret, profile, done) {
    //console.log(JSON.stringify(profile, null, 2));
    //Asynchronous wrap for MongoDB call
    process.nextTick(function () {
      //if user isn't logged in
      if (!req.user) {
        User.findOne({ 'twitter.id': profile.id},
            function(err, user) {
          if (err)
            return done(err);
          if (user) {
            return done(null, user);
          } else {
            // user doesn't exist, create user with unique username

            //user twitter username
            var username = profile.username;

            //see if this username already exists
            User.findOne( {'username': username}, function(err, exists) {
              if (err) {
                return done(err);
              }
              if (exists === null) {
                //username doesn't exist, add user with username from e-mail
                var newUser = new User();

                // Set all DB fields
                newUser.username = username;
                newUser.twitter.id = profile.id;
                newUser.twitter.token = token;
                newUser.twitter.username = profile.username;
                newUser.twitter.displayName = profile.displayName;

                newUser.save(function (err) {
                  if (err) {
                    return done(err);
                  }
                  return done(null, newUser);
                });
              } else {
                //user does exist, find username with highest number next to it and add 1

                User.find({username: {$regex : '^' + username + '[0-9]*$', $options: 'i'}},{_id: 0, username:1})
                .sort({username: -1})
                .limit(1)
                .exec(function(err, highest) {
                  if (err) {
                    return done(err);
                  }
                  username = username + (Number(highest[0].username.split(username)[1] || 0) + 1);

                  var newUser = new User();

                  // Set all DB fields
                  newUser.username = username;
                  newUser.twitter.id = profile.id;
                  newUser.twitter.token = token;
                  newUser.twitter.username = profile.username;
                  newUser.twitter.displayName = profile.displayName;

                  // save user to database
                  newUser.save(function(err) {
                    if (err)
                      throw err;
                      return done(null, newUser);
                    });
                });
              }

            });
          }
        });
      } else {
        //user is logged in, see if twitter account exists in DB
        User.findOne({ 'twitter.id': profile.id},
        function(err, user) {
          if (err) {
            return done(err);
          } else if (user) {
            return done(null, false, req.flash('message', 'This Twitter account is already linked to a different user account.'));
          } else {
            //twitter account doesn't exist
            //add link to account
            var linkuser = req.user;
            linkuser.twitter.id = profile.id;
            linkuser.twitter.token = token;
            linkuser.twitter.username = profile.username;
            linkuser.twitter.displayName = profile.displayName;

            linkuser.save(function(err) {
              if (err)
                throw err;
              return done(null, user);
            });
          }
        });
      }
    });
  }));

  /**
   * Google
   **/
  passport.use(new GoogleStrategy({
    clientID: configAuth.googleAuth.clientID,
    clientSecret: configAuth.googleAuth.clientSecret,
    callbackURL: configAuth.googleAuth.callbackURL,
    passReqToCallback: true // lets us check if user is logged in
  }, function (req, token, tokenSecret, profile, done) {
    //console.log(JSON.stringify(profile, null, 2));
    //Asynchronous wrap for MongoDB call
    process.nextTick(function () {
      console.log('test');
      //if user isn't logged in
      if (!req.user) {
        console.log("logging in with Google");
        User.findOne({ 'google.id': profile.id},
            function(err, user) {
          if (err)
            return done(err);
          if (user) {
            return done(null, user);
          } else {
            // user doesn't exist, create user with unique username

            //get username from e-mail
            var username = profile.emails[0].value.split("@")[0];

            //see if this username already exists
            User.findOne( {'username': username}, function(err, exists) {
              if (err) {
                return done(err);
              }
              if (exists === null) {
                //username doesn't exist, add user with username from e-mail
                var newUser = new User();

                // Set all DB fields
                newUser.username = username;
                newUser.google.id = profile.id;
                newUser.google.token = token;
                newUser.google.name = profile.displayName;
                newUser.google.email = profile.emails[0].value;

                newUser.save(function (err) {
                  if (err) {
                    return done(err);
                  }
                  return done(null, newUser);
                });
              } else {
                //user does exist, find username with highest number next to it and add 1

                User.find({username: {$regex : '^' + username + '[0-9]*$', $options: 'i'}},{_id: 0, username:1})
                .sort({username: -1})
                .limit(1)
                .exec(function(err, highest) {
                  if (err) {
                    return done(err);
                  }
                  username = username + (Number(highest[0].username.split(username)[1] || 0) + 1);

                  var newUser = new User();

                  // Set all DB fields
                  newUser.username = username;
                  newUser.google.id = profile.id;
                  newUser.google.token = token;
                  newUser.google.name = profile.displayName;
                  newUser.google.email = profile.emails[0].value;

                  // save user to database
                  newUser.save(function(err) {
                    if (err)
                      throw err;
                      return done(null, newUser);
                    });
                  });
                }

              });
          }
        });
      } else {
        //user is logged in, see if google account exists in db
        console.log("google auth... but logged in");
        User.findOne({ 'google.id': profile.id},
        function(err, user) {
          if (err) {
            return done(err);
          } else if (user) {
            console.log("google id found in DB.");
            return done(null, false, {'message': 'This Google account is already linked to a different user account.'});
          } else {
            //google account doesn't exist
            //add link to account
            var linkuser = req.user;
            linkuser.google.id = profile.id;
            linkuser.google.token = token;
            linkuser.google.name = profile.displayName;
            linkuser.google.email = profile.emails[0].value;

            linkuser.save(function(err) {
              if (err)
                throw err;
              return done(null, user);
            });
          }
        });
      }
    });
  }));
};

module.exports = YouShallNotPass;
