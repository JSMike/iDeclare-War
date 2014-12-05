var User = require('./models/user');
var Hist = require('./models/history');

var routes = function(app, passport) {

  /**
   * Main page
   **/
  // Show main page on get
  app.get('/', function(req, res) {
    if(req.isAuthenticated()) {
      res.render('index.ejs', { message: req.flash('message') });
    } else {
      res.render('login.ejs', { message: req.flash('message') });
    }
  });

  /**
   * Angular Templates
   **/


   app.get('/views/local.ejs', function(req, res) {
     res.render('local.ejs');
   });

  //  app.get('/views/connect-local.ejs', function(req, res) {
  //    res.render('connect-local.ejs', { message: req.flash('message')});
  //  });

   app.get('/views/signup.ejs', function(req, res) {
     res.render('signup.ejs');
   });

   app.get('/views/:view', function(req, res) {
     res.render(req.params.view, { user: req.user });
   });

   app.get('/user/:username', function(req, res) {
     User.findOne({ username:  {$regex: '^' + req.params.username + '$', $options: 'i' }}, function(err, data) {
       if(err || data === null) {
         res.send({ username: null });
       } else {
         var userData = {};
         userData.username = data.username;
         userData.id = data._id;

         Hist.find({ winner: userData.id }).count().exec(function(err2, data2) {
           if(err || data2 === null) {
             res.send(userData);
           } else {
             userData.wins = data2;

             Hist.find({ loser: userData.id }).count().exec(function(err3, data3) {
               userData.losses = data3;
               res.send(userData);
             });
           }
         });
       }
     });
   });

   app.post('/rename/:username/:newname', function(req, res) {
     var valid = /^[0-9a-zA-Z_\.\-\+]{2,30}$/;
     if ((req.user.username == req.params.username) && (req.params.newname.length > 0) && (valid.test(req.params.newname))) {
       User.findOne({ username:  { $regex: '^' + req.user.username + '$', $options: 'i' }}, function(err, data) {
         if (err) {
           console.log("Error renaming: " + req.user.username + " to " + req.params.newname + ": " + err);
           res.send({ username: req.user.username });
         } else {
           data.username = req.params.newname;
           data.save(function(err2, data2, applied) {
             if (err2) {
               console.log("Error renaming: " + req.user.username + " to " + req.params.newname + ": " + err);
               res.send({ username: req.user.username });
             } else {
               res.user = data2;
               res.send({ username: data2.username });
             }
           });
         }
       });
     } else {
       res.send({});
     }
   });

  /**
   * Old War
   **/
   /*
  app.get('/war', isLoggedIn, function (req, res) {
    res.render('war.ejs');
  });
  */

  /**
   * Login form
   **/


  /***************************************
   * Login Routes - For if not logged in *
   ***************************************/
  // Process login form on post
  app.post('/local', notLoggedIn, passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to profile
    failureRedirect: '/local', // redirect back to login page
    failureFlash: true  // allow messages
  }));

  //
  // /**
  //  * Signup form
  //  **/
  // // Show signup page on get

  // Process signup page on post
  app.post('/signup', notLoggedIn, passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to profile
    failureRedirect: '/signup', // redirect back to signup
    failureFlash: true  // allow messages
  }));

  /**
   * Facebook Routes
   **/
  // Authenticate and login through facebook
  app.get('/auth/facebook', notLoggedIn, passport.authenticate('facebook', { scope: 'email' }));

  app.get('/auth/facebook/callback', notLoggedIn,
    passport.authenticate('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/',
      failureFlash: true
    }));

  /**
   * Twitter Routes
   **/
  app.get('/auth/twitter', notLoggedIn, passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', notLoggedIn,
    passport.authenticate('twitter', {
      successRedirect: '/profile',
      failureRedirect: '/',
      failureFlash: true
    }));

  /**
   * Google Routes
   **/
  app.get('/auth/google', notLoggedIn, passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback', notLoggedIn,
      passport.authenticate('google', {
      successRedirect: '/profile',
      failureRedirect: '/',
      failureFlash: true
    }));

  /***************************
   * Routes for if logged in *
   ***************************/

  /**
   * User profile page
   **/
  // Show profile on get if user logged in.
  // app.get('/profile', isLoggedIn, function(req, res) {
  //   //req.session
  //   res.render('profile.ejs', {
  //     user : req.user // get the user out of the session and pass it to the template
  //   });
  // });

  /**
   * Logout
   **/
  app.get('/logout', isLoggedIn, function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // /**
  //  * Connect Other Login Methods
  //  **/
  //
  // //Local
  //
  //
  // app.post('/connect/local/', isLoggedIn, passport.authenticate('local-signup', {
  //   successRedirect: '/profile',
  //   failureRedirect: '/connect/local',
  //   failureFlash: true
  // }));
  //
  // //Facebook
  // app.get('/connect/facebook', isLoggedIn, passport.authorize('facebook', { scope: 'email' }));
  // app.get('/connect/facebook/callback',
  //   passport.authorize('facebook', {
  //     successRedirect: '/profile',
  //     failureRedirect: '/',
  //     failureFlash: true
  //   }));
  //
  // //Twitter
  // app.get('/connect/twitter', isLoggedIn, passport.authorize('twitter', { scope: 'email' }));
  // app.get('/connect/twitter/callback',
  //   passport.authorize('twitter', {
  //     successRedirect: '/profile',
  //     failureRedirect: '/',
  //     failureFlash: true
  //   }));
  //
  // //Google
  // app.get('/connect/google', passport.authorize('google', { scope: ['profile','email'], failureFlash: true }));
  // app.get('/connect/google/callback',
  //   passport.authorize('google', {
  //     successRedirect: '/profile',
  //     failureRedirect: '/',
  //     failureFlash: true
  //   }));
  //
  // /**
  //  * Routes for unlinking accounts
  //  **/
  //
  // //Local
  // app.get('/unlink/local', isLoggedIn, function(req, res) {
  //   var user = req.user;
  //   user.local.email = null;
  //   user.local.password = null;
  //   user.save(function(err) {
  //     if (err)
  //       throw err;
  //     res.redirect('/profile');
  //   });
  // });
  //
  // //Facebook
  // app.get('/unlink/facebook', isLoggedIn, function(req, res) {
  //   var user = req.user;
  //   user.facebook.id = null;
  //   user.facebook.token = null;
  //   user.facebook.email = null;
  //   user.facebook.name = null;
  //   user.save(function(err) {
  //     if (err)
  //       throw err;
  //     res.redirect('/profile');
  //   });
  // });
  //
  // //Twitter
  // app.get('/unlink/twitter', isLoggedIn, function(req, res) {
  //   var user = req.user;
  //   user.twitter.id = null;
  //   user.twitter.token = null;
  //   user.twitter.displayName = null;
  //   user.twitter.username = null;
  //   user.save(function(err) {
  //     if (err)
  //       throw err;
  //     res.redirect('/profile');
  //   });
  // });
  //
  // //Google
  // app.get('/unlink/google', isLoggedIn, function(req, res) {
  //   var user = req.user;
  //   user.google.id = null;
  //   user.google.token = null;
  //   user.google.email = null;
  //   user.google.name = null;
  //   user.save(function(err) {
  //     if (err)
  //       throw err;
  //     res.redirect('/profile');
  //   });
  // });

  //Catch all other requests, defer to Angular routing.

  app.get('*', function(req, res) {
    var msg = req.flash('message');
    console.log("flash: " + msg);
    if(req.isAuthenticated()) {
      res.render('index.ejs', { message: msg });
    } else {
      res.render('login.ejs', { message: msg });
    }
  });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if logged in return.
  if (req.isAuthenticated())
    return next();
  // if not logged in redirect.
  res.redirect('/');
}

// middleware to make sure login pages aren't reached by logged in users
function notLoggedIn(req, res, next) {
  // if logged in return.
  if (!req.isAuthenticated())
    return next();
    // if not logged in redirect.
    res.redirect('/profile');
  }

module.exports = routes;
