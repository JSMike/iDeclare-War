var warApp = angular.module('warApp', ['ngRoute','luegg.directives','ngSanitize','ui.bootstrap','dialogs.main']);

warApp.controller('warController', function($scope, socket, $http, dialogs, $rootScope){
  // For warning messages
  $scope.message = {};
  $scope.init = function(msg) {
    $scope.message.data = msg;
  };

  // Scrolling on by default
  $scope.glued = true;

  // Userlist Select
  $scope.selectedIndex = -1;

  $scope.userSelect = function($index) {
    $scope.selectedIndex = $index;
    $scope.opponent = null;
    //if selected user isn't self then set opponent variable.
    if ($scope.userlist[$index] != $scope.user.username) {
      $http.get('/user/' + $scope.userlist[$index])
      .success(function(data) {
        $scope.opponent = data;
        console.log(data);
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
    }
  };

  // Change Username
  $scope.changing = {};
  $scope.changing.status = false;
  $scope.useravail = {};
  $scope.useravail.status = false;
  $scope.user = {};
  $scope.user.username = "";

  $scope.changeToggle = function (apply) {
    if ($scope.changing.status === false) {
      $scope.user.oldusername = $scope.user.username;
    } else if (apply === true && $scope.useravail.status) {
      $http.post('/rename/' + $scope.user.oldusername + "/" + $scope.user.username)
      .success(function(data) {
        if (data.username) {
          $scope.userlist[$scope.userlist.indexOf($scope.user.oldusername)] = data.username;
          $scope.user.username = data.username;
          socket.emit('rename', "");
          delete $scope.user.oldusername;
        } else {
          $scope.user.oldusername = $scope.user.username;
        }
      })
      .error(function(data) {
        console.log('Error: ' + data);
        $scope.user.oldusername = $scope.user.username;
      });
    } else {
      $scope.user.oldusername = $scope.user.username;
    }
    $scope.changing.status = !$scope.changing.status;
  };

  $scope.$watch('user.username', function() {
    if ($scope.user.oldusername) {
      var valid = /^[0-9a-zA-Z_\.\-\+]{2,30}$/;
      if(valid.test($scope.user.username)) {
        $http.get('/user/' + $scope.user.username)
        .success(function(data) {
          if(data.username) {
            $scope.useravail.status = false;
          } else {
            $scope.useravail.status = true;
          }
        })
        .error(function(data) {
          console.log('Error');
          $scope.useravail.status = false;
        });
      } else {
        $scope.useravail.status = false;
      }
    } else {
      $scope.useravail.status = false;
    }

  });

  // Socket.io
  $scope.userlist = [];
  $scope.chat = [];


  function removeCommand(str) {
    str = str.match(/\S+/g);
    str.shift();
    str = str.join(' ');
    return str;
  }

  $scope.sendchat = function () {
   if ($scope.chatinput.indexOf('/w ') === 0) {
      socket.emit('whisper', removeCommand($scope.chatinput).trim());
    } else if (($scope.chatinput.indexOf('/em ') === 0) ||
        ($scope.chatinput.indexOf('/me ') === 0) ||
        ($scope.chatinput.indexOf('/emote ') === 0)) {
      socket.emit('emote', removeCommand($scope.chatinput).trim());
    } else if ($scope.chatinput.indexOf('/challenge ') === 0) {
      var opponent = removeCommand($scope.chatinput).trim();
      socket.emit('challenge', opponent);
    } else if ($scope.chatinput.indexOf('/accept') === 0) {
      socket.emit('accept', true);
    } else if ($scope.chatinput.indexOf('/pickem ') === 0) {
      socket.emit('pickem', removeCommand($scope.chatinput).trim());
    } else if ($scope.chatinput.indexOf('/reject') === 0) {
      socket.emit('reject', true);
    } else if ($scope.chatinput.indexOf('/cancel') === 0) {
      socket.emit('cancel', true);
    } else if (($scope.chatinput.indexOf('/info') === 0) ||
        ($scope.chatinput.indexOf('/stats') === 0)) {
      socket.emit('info', removeCommand($scope.chatinput).trim());
    } else if (($scope.chatinput.indexOf('/help') === 0) ||
        ($scope.chatinput.indexOf('/?') === 0)) {
      socket.emit('help', true);
    } else {
      socket.emit('chat', $scope.chatinput);
    }
    $scope.chatinput = "";
  };

  socket.on('init', function (data) {
    $scope.user.username = data.username;

    $http.get('/user/' + data.username)
    .success(function(data) {
      $scope.user = data;
    })
    .error(function(data) {
      console.log('Error: ' + data);
    });

  });

  socket.on('chat', function (message) {
    $scope.chat.push(message);
  });

  socket.on('userlist', function (data) {
    $scope.userlist = data;
  });

  // War Game
  $scope.war = {};
  $scope.war.player1 = {};
  $scope.war.player2 = {};
  $scope.war.pool = {};

  $scope.challenge = function(game, user) {
    if (user == "The Computer") {
      if (game == "war") {
        socket.emit('singlePlayer', 'war');
      } else if (game == "pass") {
        socket.emit('singlePlayer', 'pass');
      } else {
        socket.emit('singlePlayer', 'discard');
      }
    } else {
      if (game == "war") {
        socket.emit('challenge', user + ' war');
      } else if (game == "pass") {
        socket.emit('challenge', user + ' pass');
      } else {
        socket.emit('challenge', user + ' discard');
      }
    }
  };

  socket.on('challenge', function(data) {
    $scope.challenge.username = data.username;
    $scope.challenge.game = data.game;
    dlg = dialogs.confirm('Incoming Challenge!', $scope.challenge.username + " has challenged you to a game of " + $scope.challenge.game + "! Do you accept?");
    dlg.result.then(function(btn){
      socket.emit('accept', true);
      $scope.confirmed = 'accept';
    },function(btn){
      socket.emit('reject', true);
      $scope.confirmed = 'reject';
    });
  });

  socket.on('war', function (data) {
    $scope.war = data;
    angular.element('.player1card').css("background-image", "url(/img/" + data.player1.card.toLowerCase() + ")").css("background-size", "contain").css("background-repeat", "no-repeat");
    angular.element('.player2card').css("background-image", "url(/img/" + data.player2.card.toLowerCase() + ")").css("background-size", "contain").css("background-repeat", "no-repeat");
  });

  //pickem
  $scope.pickem = {};

  socket.on('pickem', function (data) {
    $scope.war.player1.name = data.player.nickname;
    $scope.war.player1.count = data.player.picked;
    $scope.war.player2.name = data.opponent.nickname;
    $scope.war.player2.count = data.opponent.picked;
    if (($scope.pickem.card != data.player.viewing) && (data.player.picked < 13)){
      $scope.pickem.card = data.player.viewing;
      $scope.pickem.game = data.gametype;

      dlg = dialogs.confirm($scope.pickem.game, "<div class='text-center'><img src='/img/" + $scope.pickem.card.toLowerCase() + "'> <br> <h2>Choose wisely!<h2></div>");
      dlg.result.then(function(btn){
        socket.emit('pickem', 'true');
        $scope.confirmed = 'accept';
      },function(btn){
        socket.emit('pickem', 'false');
        $scope.confirmed = 'reject';
      });
    }
  });
});

warApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
  .when('/', { templateUrl: 'views/profile.ejs' })
  .when('/war', { templateUrl: 'views/war.ejs' })
  .when('/profile', {templateUrl: 'views/profile.ejs'})
  .otherwise({redirectTo: '/'});

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

}]);

warApp.directive('message', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      messageData: '='
    },
    controller: function($scope) {
      if (typeof $scope.messageData !== 'undefined' && $scope.messageData.length > 0) {
        $scope.classes = "col-sm-4 col-sm-offset-4 alert alert-danger";
        $scope.msg = $scope.messageData;
        $scope.messageData = "";
      } else {
        $scope.classes = "";
        $scope.msg = "";
      }
    },
    template: "<div class={{classes}}>{{msg}}</div>"
  };
});

warApp.directive('navbar', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: false,
    templateUrl: 'views/navbar.ejs'
  };
});

warApp.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});

// warApp.directive('cardwidth', function() {
//   return {
//     restrict: 'A',
//     link: function(scope, elem) {
//       // scope.$watch( function() {
//       //   scope.cardElement = {};
//       //   scope.cardElement.width = elem.prop('offsetWidth');
//       // });
//       var e = angular.element(elem);
//
//     }
//   };
// });
//
//
// warApp.directive('cardheight', function() {
//   return {
//     restrict: 'A',
//     link: function(scope, elem, attr) {
//       scope.$watch('')
//       scope.cardElement = {};
//       scope.cardElement.height = elem.height();
//       console.log("test outside");
//       scope.$watch( function () {
//         console.log("test inside");
//         elem.attr('style', 'height: ' + (elem.width() * 1.452) + 'px');
//       });
//     }
//   };
// });

// warApp.directive("cardwidth",function(){
//   return{
//     link:function(){
//       var cards = angular.element(".card");
//
//       scope.$watch(function () { return element.prop('offsetWidth'); },
//       function (newValue, oldValue) {
//         if (newValue != oldValue) {
//           // Do something ...
//           console.log(newValue);
//         }
//       }
//     );
//   }
// };
// });
