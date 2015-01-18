/**
 * War Server
 * Author: Michael Cebrian
 * Date: 09/19/2014
 * Description: Web server that allows connected users to play War.
 **/

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var host = process.env.IP || 'localhost';
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var passportSocketIo = require('passport.socketio');
var sessionSocketIo = require('session.socket.io');
var favicon = require('serve-favicon');
var server = require('http').createServer(app);
var subdomain = require('express-subdomain');


// Mongoose Settings
var dbPort = 27017;
var configDB = require('./config/database')(host, dbPort);
mongoose.connect(configDB.url);

// Express extensions
var sessionInfo = require('./config/session');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var sessionConf = require('./config/session');

// passport configuration
require('./config/passport')(passport);

// Set up Express

var dbStore = new mongoStore({ mongoose_connection: mongoose.connections[0] });
app.set('view engine', 'ejs');
var sessionHandler = session({
  name: sessionInfo.name,
  secret: sessionInfo.secret,
  store: dbStore,
  cookie: {}
});

app.use(subdomain('war'));
app.use(morgan('dev'));
app.use(cookieParser(sessionInfo.secret));
app.use(bodyParser());
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public'));
app.use(sessionHandler);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Add routes
require('./config/routes.js')(app, passport);

// Setup Socket.io
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
io.use(passportSocketIo.authorize({
  passport: passport,
  cookieParser: cookieParser,
  key: sessionInfo.name,
  secret: sessionInfo.secret,
  store: dbStore,
  success: function(data, accept) {
    console.log("successful socket.io auth.");
    accept();
  },
  fail: function(data, message, error, accept) {
    if (error) {
      accept(new Error(message));
    }
    console.log("failed to connect to socket.io: " + message);
    //accept(null, false);
  }
}));

require('./war/WarServer')(io);

// Everything is set up now, start listening for connections
server.listen(port);

console.log(new Date().toString(),'\nServer listening on port: ' + port);
