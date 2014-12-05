// Need to replace the fake MongoDB statements with actual MongoDB calls.
// Users will be added to DB when they log in.

var Player = function (id, socket) {
  this.id = id;
  this.socket = socket;
};

Player.prototype.name = function () {
  return MongoDB.getObject(id).name;
};

Player.prototype.wins = function (id) {
  var wins;
  if (id != null) {
    wins = MongoDB.getObject(this.id).whereOppoenentEquals(id).wins;
  } else { 
    wins = MongoDB.getObject(this.id).wins;
  }
  return wins;
};

Player.prototype.losses = function (id) {
  var losses;
  if (id != null)) {
    losses = MongoDB.getObject(this.id).whereOppoenentEquals(id).losses;
  } else {
   losses = MongoDB.getObject(this.id).losses;
  }
  return losses;
};

Player.prototype.winPercent = function (id) {
  var wins = this.wins(id);
  var losses = this.losses(id);
  var percent;

  if (losses == 0) {
    if (wins == 0) {
      percent = 0;
    } else {
      percent = 100;
    }
  } else {
    percent = Math.floor((wins / losses) * 100);
  }
  
  return percent;
};

module.exports = Player;