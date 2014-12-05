var loginApp = angular.module('loginApp', ['ngRoute']);

loginApp.controller('loginController', function($scope){
  $scope.message = {};
  $scope.init = function(msg) {
    $scope.message.data = msg;
  };
});

loginApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
  .when('/', { templateUrl: 'views/loginMethods.ejs' })
  .when('/local', { templateUrl: 'views/local.ejs' })
  .when('/signup', { templateUrl: 'views/signup.ejs' })
  .otherwise({redirectTo: '/'});

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

}]);

loginApp.directive('message', function() {
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
