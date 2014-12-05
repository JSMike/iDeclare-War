/**
 * War Server
 * Author: Michael Cebrian
 * Date: 09/19/2014
 * Description: Web server that allows connected users to play War.
 **/
var WarServer = function(io) {

  //var io = require('socket.io').listen(app);
  var War = require('./war');
  var Pickem = require('./pickem');
  var UserDB = require('../config/models/user');
  var HistoryDB = require('../config/models/history');
  var async = require('async');

  // Add stripTags() function to String if it doesn't exist.
  String.prototype.stripTags = String.prototype.stripTags || function () {
    return this.replace(/(<([^>]+)>)/ig,"");
  };

  // Initiate global users object to maintain users online
  global.users = {};

  addComputerPlayer();

  /**
   * Function to handle when browsers try to connect to socket.io
   **/
  io.on('connection', function (socket) {
    //console.log(JSON.stringify(Object.keys(socket.request)));
    //console.log("headers: " + JSON.stringify(socket.handshake.headers, null, 2));
    //console.log("user: " + JSON.stringify(socket.request.user, null, 2));
    socket.nickname = socket.request.user.username;
    global.users[socket.nickname] = {};
    global.users[socket.nickname].socket = socket;
    global.users[socket.nickname].id = socket.request.user._id;

    socket.emit('init', { username: socket.nickname });
    socket.emit('chat', "Welcome " + socket.nickname + "!");
    //socket is the variable for the individual that is connected
    socket.emit('chat', 'You can use the /help command for more info.');
    //socket.emit('userlist', Object.keys(global.users));

    userUpdate();

    socket.on('rename', function () {
      UserDB.findOne({_id: global.users[socket.nickname].id}, function(err, data) {
        if (err) {
          console.log('err');
        } else {
          var oldname = socket.nickname;
          var temp = global.users[socket.nickname];
          socket.nickname = data.username;
          global.users[socket.nickname] = temp;
          delete global.users[oldname];
          userUpdate();
        }
      });
    });
    // Begin looking for nick command.
    // The /nick will be removed from data on the client side.
    // Need to make more of the communications strip the escaped commands on client side.
    // socket.on('nick', function (nick) {
    //
    //   // Remove all tags that malicious chatters might try to use.
    //   nick = nick.stripTags().trim();
    //   checkValidNick(socket, nick, function (data) {
    //     if (typeof data === 'string') {
    //       socket.emit('chat', data);
    //     } else {
    //       //If valid nickname and user doesn't already have nick
    //       //Set local variables and start looking for chat commands
    //       socket.nickname = nick;
    //       global.users[socket.nickname] = {};
    //       global.users[socket.nickname].socket = socket;
    //
    //       //initialize player
    //       initializePlayer(socket.nickname, function(exists) {
    //         if (exists) {
    //           socket.emit('chat', 'Welcome back ' + socket.nickname + '!');
    //         } else {
    //           socket.emit('chat', 'Welcome ' + socket.nickname + '!');
    //         }
    //       });
    //
    //       userUpdate();
    //     }
    //   });
    // });

    // When user sends a chat message
    socket.on('chat', function (data) {
      if (!socket.nickname) {
        socket.emit('chat', 'You must choose a nickname before you can chat.');
      } else {
        data = data.stripTags().trim();
        //replace newline with <br>
        if(data.length !== 0) {
          data = data.match(/[^\r\n]+/g).join('<br>');
        }
        io.sockets.emit('chat', socket.nickname + ": " + data);
      }
    });

    // when user tries to whisper
    socket.on('whisper', function (data) {
      if (!socket.nickname) {
        socket.emit('chat', 'You must choose a nickname before you can whisper.');
      } else {
        data = data.stripTags().trim();
        if (data.indexOf('The Computer') === 0) {
            data = data.match(/\S+/g);
            data.shift();
            data.shift();
            data = data.join(' ');
            socket.emit('chat', '<span class="red">Whisper to <b>The Computer</b>:</span> ' + data);
            socket.emit('chat', "<span class='blue'>Whisper from <b>The Computer</b>: I'm afraid I can't do that " + socket.nickname + '</span>');
        } else {
          data = data.match(/\S+/g);
          var nick = data.shift();
          data = data.join(' ');
          if (data.length !== 0) {
            data = data.match(/[^\r\n]+/g).join('<br>');
          }
          if (nick in global.users) {
            global.users[nick].socket.emit('chat', '<span class="blue">Whisper from ' + socket.nickname + ':</span> ' + data);
            socket.emit('chat', '<span class="red">Whisper to ' + nick + ":</span> " + data);
          } else {
            socket.emit('chat', 'User ' + nick + ' is offline.');
          }
        }
      }
    });

    // when user sends an emote
    socket.on('emote', function (data) {
      if (!socket.nickname) {
        socket.emit('chat', 'You must choose a nickname before you can whisper.');
      } else {
        data = data.stripTags().trim();
        if (data.length !== 0) {
          data = data.match(/[^\r\n]+/g).join('<br>');
        }
        io.sockets.emit('chat', '<span class="blue"><b> ' + socket.nickname + '</b> ' + data + '</span>');
      }
    });

    // when user sends a challenge
    socket.on('challenge', function (data) {
      if(!socket.nickname) {
        socket.emit('chat', 'You must choose a nickname before you can challenge.');
      } else {
        data = data.stripTags();
        data = data.match(/\S+/g);
        var nick = data[0];
        var type = data[1];

        //make function to check if valid challenge
        checkValidChallenge(socket, nick, type, function (isValid, type) {
          if (typeof isValid === 'string') {
            socket.emit('chat', isValid);
          } else {

            var gameType;
            if (type  === 'pass') {
              gameType = "Pickem & Pass";
            } else if (type ==='discard') {
              gameType = "Pickem & Discard";
            } else {
              gameType = "War";
            }

            //Successful Challenge, send messages, and add challenge property to both users
            //this will track if they're currently in a challenge and who it was from/to
            // global.users[nick].socket.emit('chat', "You've been challenged by " + socket.nickname + " to a game of " + gameType + "!<br>" +
            //     "<a href='/" + type + "' ng-click='accept()'>Click here to accept</a> "+
            //     "within the next 60 seconds to begin playing, or " +
            //     "<a href='/' ng-click='reject()' onclick='return false;'>Click here to reject</a>.");
            //
            // socket.emit('chat', 'Challenge sent to ' + nick + ' waiting 60 seconds for reply. ' +
            //     '<a href="/profile" ng-click="cancel()">Click here to cancel</a> the challenge.');

            global.users[nick].socket.emit('challenge', { username: socket.nickname, game: gameType });

            var challenge = {};
            challenge.challenger = socket.nickname;
            challenge.challengee = nick;
            challenge.type = type;
            challenge.gameType = gameType;
            //create timeout to delete the challenge flags after 60 seconds if not accepted.
            challenge.timeout = setTimeout(clearChallenge, 60000, challenge);

            global.users[socket.nickname].challenge = challenge;
            global.users[nick].challenge = challenge;
          }
        });
      }
    });

    // when user accepts challenge
    socket.on('accept', function (data) {
      if(!socket.nickname) {
        socket.emit('chat', 'You must choose a nickname before you can challenge.');
      } else {
        isAcceptValid(socket, function (isValid) {
          if(typeof isValid === 'string') {
            socket.emit('chat', isValid);
          } else {
            var p1 = global.users[socket.nickname].challenge.challenger;
            var gameType = global.users[socket.nickname].challenge.gameType;
            var type = global.users[socket.nickname].challenge.type;
            var room = 'WarRoom' + Object.keys(io.sockets.adapter.rooms).length;
            var sts;

            if (global.users[socket.nickname].challenge.type in {'pass':1, 'discard':1}) {
              clearTimeout(global.users[socket.nickname].challenge.timeout);
              delete global.users[global.users[socket.nickname].challenge.challenger].challenge;
              delete global.users[global.users[socket.nickname].challenge.challengee].challenge;

              global.users[p1].socket.emit('chat','Challenge Accepted! ' + gameType + ' starting with ' + socket.nickname);
              socket.emit('chat','Challenge Accepted! Game starting with ' + p1);
              global.users[p1].game = true;
              global.users[socket.nickname].game = true;

              socket.join(room);
              global.users[p1].socket.join(room);
              io.sockets.in(room).emit('chat', 'You have entered ' + room);
              io.sockets.adapter.rooms[room].game = new Pickem(p1, socket.nickname, type);

              global.users[p1].room = room;
              global.users[socket.nickname].room = room;

              //get the status of the status of the game
              sts = io.sockets.adapter.rooms[room].game.status(socket.nickname);

              //send the status to both players clients by sending it to everyone in the room
              socket.emit('pickem', sts);

              sts = io.sockets.adapter.rooms[room].game.status(p1);

              global.users[p1].socket.emit('pickem', sts);
            } else {
              clearTimeout(global.users[socket.nickname].challenge.timeout);
              delete global.users[global.users[socket.nickname].challenge.challenger].challenge;
              delete global.users[global.users[socket.nickname].challenge.challengee].challenge;

              global.users[p1].socket.emit('chat','Challenge Accepted! War starting with ' + socket.nickname);
              socket.emit('chat','Challenge Accepted! Game starting with ' + p1);
              global.users[p1].game = true;
              global.users[socket.nickname].game = true;

              socket.join(room);
              global.users[p1].socket.join(room);
              io.sockets.in(room).emit('chat', 'You have entered ' + room);
              io.sockets.adapter.rooms[room].game = new War(p1, socket.nickname);

              global.users[p1].room = room;
              global.users[socket.nickname].room = room;

              //start first turn instantly
              io.sockets.adapter.rooms[room].game.nextTurn();

              //get the status of the status of the game
              sts = io.sockets.adapter.rooms[room].game.status();

              //send the status to both players clients by sending it to everyone in the room
              io.sockets.in(room).emit('war', sts);

              //recursively play war every 5 sec until a winner is found.
              autoWar(io, room);
            }
          }
        });
      }
    });

    //when single player game requested
    socket.on('singlePlayer', function (data) {
      if(!socket.nickname) {
        socket.emit('chat', 'You must choose a nickname before you can challenge.');
      } else {
        data = data.stripTags();
        data = data.match(/\S+/g);
        var type = data[0].toLowerCase();

        //make sure user isn't in a game already, and isn't being challenged.
        isAvailableForGame(socket.nickname, function(cb){
          if (typeof cb ==='string') {
            socket.emit('chat', cb);
          } else {
            var room = 'WarRoom' + Object.keys(io.sockets.adapter.rooms).length;
            global.users[socket.nickname].game = true;

            socket.join(room);
            io.sockets.in(room).emit('chat', 'You have entered ' + room);
            global.users[socket.nickname].room = room;

            var gameType;
            if (type  === 'pass') {
              gameType = "Pickem & Pass";
            } else if (type ==='discard') {
              gameType = "Pickem & Discard";
            } else {
              gameType = "War";
            }


            if(type in {'pass':1, 'discard':1}) {

              io.sockets.adapter.rooms[room].game = new Pickem(socket.nickname, 'The Computer', type);

              socket.emit('chat','Game of ' + gameType + ' starting against The Computer');

              computerPickem(room, function () {
                //get the status of the status of the game
                sts = io.sockets.adapter.rooms[room].game.status(socket.nickname);

                //send the status to the player.
                socket.emit('pickem', sts);

              });
            } else {
              io.sockets.adapter.rooms[room].game = new War(socket.nickname, 'The Computer');

              socket.emit('chat','Game starting against The Computer');
              //start first turn instantly
              io.sockets.adapter.rooms[room].game.nextTurn();

              //get the status of the status of the game
              var sts = io.sockets.adapter.rooms[room].game.status();

              //send the status to both players clients by sending it to everyone in the room
              io.sockets.in(room).emit('war', sts);

              //recursively play war every 5 sec until a winner is found.
              autoWar(io, room);
            }
          }
        });
      }
    });

    socket.on('info', function (data) {
      data = data.trim();
      if (data.indexOf('The Computer') === 0) {
        data = 'The Computer';
      } else {
        data = data.match(/\S+/g);
        data = data.shift();
        data = data.trim();
      }

      if ((data.length === 0) && !socket.nickname) {
        socket.emit('chat', 'You must be logged in to see your statistics.');
      } else if (data.length === 0) {
        async.waterfall([
            function(cb) {
              HistoryDB.count({winner: global.users[socket.nickname].id},
                function(err, res) {
                  cb(err, res);
                }
              );
            },
            function(wins, cb) {
              HistoryDB.count({loser: global.users[socket.nickname].id},
                function(err, res) {
                  //console.log("Wins: " + wins + ", Losses: " + res);
                  cb(err, wins, res);
                }
              );
            }
          ],
          function(err, wins, losses) {
            socket.emit('chat', "Your Statistics:<br>" +
                "Wins: " + wins + ", Losses: " + losses + ", Win Percentage: " + (losses === 0 ? (wins > 0 ? '100' : '0') : Math.floor(wins / (wins + losses) * 100)) + "%");
          }
        );

      } else {
        getIdFromNick(data, function(err, id) {
          if (err !== null) {
            socket.emit('chat', 'Error: ' + err);
          } else if (id === null) {
            socket.emit('chat', 'There are no statistics for ' + data);
          } else {
            async.waterfall([
                function(cb) {
                  HistoryDB.count({winner: id},
                    function(err, res) {
                      cb(err, res);
                    }
                  );
                },
                function(wins, cb) {
                  HistoryDB.count({loser: id},
                    function(err, res) {
                      //console.log("Wins: " + wins + ", Losses: " + res);
                      cb(err, wins, res);
                    }
                  );
                }
              ],
              function(err, wins, losses) {
                socket.emit('chat', "Statistics on " + data + ":<br>" +
                    (((typeof socket.nickname === 'string') && (socket.nickname !== data)) ? "Overall: <br>" : "") +
                    "Wins: " + wins + ", Losses: " + losses + ", Win Percentage: " + (losses === 0 ? (wins > 0 ? '100' : '0') : Math.floor(wins / (wins + losses) * 100)) + "%");
              }
            );

            if ((typeof socket.nickname === 'string') && (socket.nickname !== data)){
              async.waterfall([
                function(cb) {
                  HistoryDB.count({winner: global.users[socket.nickname].id, loser: id},
                    function(err, res) {
                      cb(err, res);
                    }
                  );
                },
                function(wins, cb) {
                  HistoryDB.count({winner: id, loser: global.users[socket.nickname].id},
                    function(err, res) {
                      //console.log("Wins: " + wins + ", Losses: " + res);
                      cb(err, wins, res);
                    }
                  );
                }
              ],
              function(err, wins, losses) {
                socket.emit('chat', "Statistics vs. " + data + ":<br>" +
                    "Wins: " + wins + ", Losses: " + losses + ", Win Percentage: " + (losses === 0 ? (wins > 0 ? '100' : '0') : Math.floor(wins / (wins + losses) * 100)) + "%");
              });
            }
          }
        });
      }
    });

    socket.on('pickem', function (data) {
      if (!socket.nickname) {
        socket.emit('chat', 'You must be logged in for Pickem.');
      } else {
        checkValidPickemGame(socket, function (cb) {
          if(data.toLowerCase() === 'true') {
            data = true;
          } else if(data.toLowerCase() === 'false') {
            data = false;
          }
          if (typeof cb === 'string') {
            socket.emit('chat', cb);
          } else if (typeof data !== 'boolean') {
            socket.emit('chat', 'Invalid Pickem option: ' + data);
          } else {
            var room = global.users[socket.nickname].room;
            var game = io.sockets.adapter.rooms[room].game;
            //need to split messages up for this instead of to the room.
            game.keep(socket.nickname, data);

            var sts = game.status(socket.nickname);
            if (sts.player.picked === 13 && sts.opponent.picked === 13) {
              var players = game.warInfo();
              io.sockets.adapter.rooms[global.users[socket.nickname].room].game = new War(players[0], players[1]);
              //start first turn instantly
              io.sockets.adapter.rooms[room].game.nextTurn();

              //get the status of the status of the game
              sts = io.sockets.adapter.rooms[room].game.status();

              //send the status to both players clients by sending it to everyone in the room
              io.sockets.in(room).emit('war', sts);

              //recursively play war every 5 sec until a winner is found.
              autoWar(io, room);
            } else {
              socket.emit('pickem', sts);
              if (sts.opponent.nickname !== 'The Computer') {
                global.users[sts.opponent.nickname].socket.emit('pickem', game.status(sts.opponent.nickname));
              }
            }
          }
        });
      }
    });


    socket.on('reject', function (data) {
      if (!socket.nickname) {
        socket.emit('chat', "You can't reject a challenge if you're not logged in.");
      } else if (typeof global.users[socket.nickname].challenge === 'undefined') {
        socket.emit('chat', "You can't reject a challenge if you're not in a challenge.");
      } else {
        clearChallenge(global.users[socket.nickname].challenge);
      }
    });

    socket.on('cancel', function (data) {
      if (!socket.nickname) {
        socket.emit('chat', "You can't cancel a challenge if you're not logged in.");
      } else if (typeof global.users[socket.nickname].challenge === 'undefined') {
        socket.emit('chat', "You can't cancel a challenge if you're not in a challenge.");
      } else {
        clearChallenge(global.users[socket.nickname].challenge);
      }
    });

    socket.on('help', function (data) {
      socket.emit('chat', 'Chat Commands:' + '\n' +
        '/nick nickname | Set nickname when you first connect.' + '\n' +
        '/w player | Send a private message to another player.' + '\n' +
        '/em, /me, /emote | Send an emote to chat.' + '\n' +
        '/challenge player | Challenge another player to war.' + '\n' +
        '/accept | Accept a challenge and start playing war.' + '\n' +
        '/reject | Reject a challenge.' + '\n' +
        '/cancel | Cancel a challenge.' + '\n' +
        '/info [player] | see playing statistics on a target player or yourself.' + '\n' +
        '/stats [player] | see playing statistics for target player or yourself.' + '\n' +
        '/help, /? | This help text.' );

    });

    socket.on('disconnect', function () {
      if (!socket.nickname)
        return;
      delete global.users[socket.nickname];
      userUpdate();
      //Make function that finds which rooms the user is in
      //Function should see if there are any open challenges or games
      //If found send message to opponent, and delete object
    });
  });

  /**
   * Send out updated userlist to all connected users.
   **/
  function userUpdate() {
    io.sockets.emit('userlist', Object.keys(global.users));
  }


  /**
   * Removes challenge variable from both players and clears the countdown timer
   **/
  function clearChallenge(challenge) {
    if (challenge.challenger in global.users) {
      global.users[challenge.challenger].socket.emit('chat', 'Challenge with ' +
          challenge.challengee + ' has expired.');
      delete global.users[challenge.challenger].challenge;
    }
    if (challenge.challengee in global.users) {
      global.users[challenge.challengee].socket.emit('chat', 'Challenge from ' +
        challenge.challenger + ' has expired.');
      delete global.users[challenge.challengee].challenge;
    }
    clearTimeout(challenge.timeout);
  }

  /**
   * autoWAr function will recursively call itself to continue playing the game
   * that's attached to the passed room every 5 seconds.
   **/
  function autoWar(io, room) {
    //The anonymous function will be callsed after 5 seconds
    setTimeout(function() {
      // Play the next turn
      io.sockets.adapter.rooms[room].game.nextTurn();

      //get the status of the status of the game
      var sts = io.sockets.adapter.rooms[room].game.status();

      //send the status to both players clients by sending it to everyone in the room
      io.sockets.in(room).emit('war', sts);

      //if no winnner call autowar again and restart timer
      if (sts.winner === null) {
        autoWar(io, room);
      } else {
        //There's a winner! send out messages and do cleanup
        io.sockets.in(room).emit('chat', 'Congratulations ' + sts.winner + "! You've won the war!");
        io.sockets.in(room).emit('chat', 'Leaving room ' + room + '.');

        // remove players from room and remove status flags.
        if (sts.player1.name in global.users) {
          global.users[sts.player1.name].socket.leave(room);
          delete global.users[sts.player1.name].game;
          delete global.users[sts.player1.name].room;
        }

        if ((sts.player2.name !== 'The Computer') && (sts.player2.name in global.users)) {
          global.users[sts.player2.name].socket.leave(room);
          delete global.users[sts.player2.name].game;
          delete global.users[sts.player2.name].room;
        }
        //This would be where to add logging to a database
        async.waterfall([
          function(cb){
            getIdFromNick(sts.winner, function (err, winner) {
              cb(err, winner);
            });
          },
          function(winner, cb) {
            getIdFromNick(sts.loser, function (err, loser) {
              cb(err, winner, loser);
            });
          }
          ],
          function (err, winner, loser) {
            if (err !== null) {
              io.sockets.on(room).emit('chat', 'Error: ' + err);
            }
            if (winner !== null && loser !== null) {
              var hist = new HistoryDB({winner: winner, loser: loser});
              hist.save();
            }
          });

        //delete the game
        delete io.sockets.adapter.rooms[room].game;

        //This is where you might delete the room from the io.sockets.adapter.rooms object array
      }
    }, 1500, io, room);
  }

  function addComputerPlayer() {
    //Make sure The Computer user exists
        UserDB.findOne({username: 'The Computer'}, function (err, comp) {
          if (comp === null) {
            var theComputer = new UserDB({username: 'The Computer'});
            theComputer.save(function (err) {
              console.log('Error making "The Computer" user: ' + err);
            });
          }
        });
  }

  var checkValidNick = function(socket, nick, cb) {
    if (typeof socket.nickname !== 'undefined') {
      // If user already has a nickname
      // This can be updated to handle changing a nickname, for now say you can't
      cb("You currently can't change nicknames after you've logged in.");
    } else if (nick === null || nick.length === 0) {
      cb('You must enter a valid nickname!<br>Please use the /nick command, ie: /nick JohnDoe');
    } else if (nick.indexOf(' ') !== -1) {
      cb('You must enter a valid nickname! Nicknames cannot contain spaces.<br>Please use the /nick command, ie: /nick JohnDoe');
    } else if (nick.length > 25) {
      cb('Please choose a nickname of 25 characters or less.');
    } else if (nick in global.users) {
      cb('nickname "' + nick + '" is already in use, please choose a unique nickname.');
    } else {
      cb(true);
    }
  };

  var checkValidChallenge = function (socket, nick, type, cb) {
    if(!socket.nickname || !(socket.nickname in global.users)) {
      cb('You must choose a nickname before you can challenge.');
    } else {
      if (typeof global.users[socket.nickname].challenge !== 'undefined') {
        cb("You can't challenge someone while in a challenge.");
      } else if (typeof global.users[socket.nickname].game !== 'undefined') {
        cb("You can't challenge someone who's in a game.");
      } else {
        nick = nick.stripTags();
        //logic to ensure that the challenge is legitimate
        if (nick in global.users) {
          if (nick === socket.nickname) {
            cb('You cannot challenge yourself.');
          } else if (global.users[nick].game) {
            cb('User ' + nick + ' is already playing a game.');
          } else if (global.users[nick].challenge) {
            cb('User ' + nick + ' is already being challenged.');
          } else {
            //nick valid, check type and options
            if (typeof type !== 'undefined') {
              if (type.toLowerCase() === 'pass') {
                cb(true, 'pass');
              } else if (type.toLowerCase() === 'discard') {
                  cb(true, 'discard');
              } else {
                cb(true, 'war');
              }
            }
          }
        } else {
          cb('User ' + nick + " is no longer online.");
        }
      }
    }
  };


  /**
   * Check if player exists in database.
   * If not then add them to the database.
   * Add their uniqueid to the global user object.
   **/
  // var initializePlayer = function(nickname, callback) {
  //  async.waterfall([
  //     function (cb) {
  //       PlayerDB.findOne({nickname: nickname}, function (err, player) {
  //         if (player === null) {
  //           var newbie = new PlayerDB({nickname: nickname, email: nickname + '@email.com'});
  //           newbie.save(function (err) {
  //             cb(err, false);
  //           });
  //
  //         } else {
  //           cb(null, true);
  //         }
  //       });
  //     },
  //     function (isInDb, cb) {
  //       PlayerDB.findOne({nickname: nickname}, function (err, player) {
  //         global.users[nickname].id = player._id;
  //         cb(null, isInDb);
  //       });
  //     }
  //   ],
  //   function (err, res) {
  //     callback(res);
  //   });
  // };

  var isAcceptValid = function(socket, cb) {
    if (socket.nickname in global.users) {
      //several steps to verify that both users are online and the proper person accepted
      if (typeof global.users[socket.nickname].challenge !== 'undefined') {
        if (global.users[socket.nickname].challenge.challengee == socket.nickname) {
          if(global.users[socket.nickname].challenge.challenger in global.users) {
            cb(true);
          } else {
            cb('Your challenger has logged out.');
            delete global.users[socket.nickname].challenge;
          }
        } else {
          cb("You must wait for your opponent to accept.");
        }
      } else {
        cb("You're not currently in a challenge.");
      }
    } else {
      cb('Connection error, please reload.');
    }
  };

  var isAvailableForGame = function (nick, cb) {
    if (typeof global.users[nick].challenge !== 'undefined') {
      cb("You can't start a new game while in a challenge.");
    } else if (typeof global.users[nick].game !== 'undefined') {
      cb("You can't start a new game while in a challenge.");
    } else {
      cb(true);
    }
  };

  var getIdFromNick = function (nick, cb) {
    UserDB.findOne({username: nick}, function (err, player) {
      cb(err, player !== null ? player._id : null);
    });
  };

  var checkValidPickemGame = function (socket, cb) {
    if (typeof global.users[socket.nickname].room === 'undefined') {
      cb("You're not currently in a game room.");
    } else if (Object.keys(io.sockets.adapter.rooms).indexOf(global.users[socket.nickname].room) === -1) {
      cb('Your room no longer exists.');
    } else if (typeof io.sockets.adapter.rooms[global.users[socket.nickname].room].game === 'undefined') {
      cb('There is no game for this room.');
    } else if (io.sockets.adapter.rooms[global.users[socket.nickname].room].game instanceof Pickem) {
      cb(true);
    } else {
      cb("The game room you're in isn't playing Pickem.");
    }
  };

  var computerPickem = function(room, cb) {
    var game = io.sockets.adapter.rooms[room].game;
    for(var i = 0; i < 13; i++) {
      var sts = game.status('The Computer');

      if(sts.value < 7) {
        game.keep('The Computer', false);
      } else {
        game.keep('The Computer', true);
      }
    }
    cb();
  };

  function userlistSoft(a,b) {
    if (a.username < b.username)
      return -1;
      if (a.username > b.username)
        return 1;
        return 0;
      }

};

module.exports = WarServer;
