/**
 * 3) A new pick your card module will be added. Allowing 2 players to view 13 cards
 *    and decide if they want to keep the card they're viewing or get a mystery card.
 *    The constructor will be passed in an array of 2 nicknames and a discard-or-pass
 *    flag. The constructor will shuffle a deck, each player will be assigned an empty
 *    hand, a pick counter, and placeholder for the card they're currently viewing.
 *    The constructor will also deal each player 1 card off the top of the deck.
 *    The view function will show them which card they're currently looking at.
 *    The keep function will be passed the player and true/false. The function will
 *    first check if the player has a card and if they've already picked 13x to see if
 *    the function call was valid. If valid the function will draw the next card and
 *    store it locally in the function. If the function was passed true it will add
 *    the card  associated with the player to their hand, otherwise it will add the
 *    locally stored card. The function will then check the discard-or-pass flag to
 *    see how it should handle the remaining card. it will increment the players picks
 *    counter by 1, and if the pick total is less than 13 it will draw a new card for
 *    the player, otherwise it will clear the card that the player is currently viewing.
 *    The module will have a status function which displays how many cards each player
 *    has picked so far and what size their hand is.
 **/

var Deck = require('./cards/deck');
var Hand = require('./cards/hand');

var Pickem = function (player1, player2, type) {
  this.isPass = type === 'pass' ? true : false;

  this.deck = new Deck();
  this.deck.shuffle();

  this.player = {};

  this.player[player1] = {};
  this.player[player1].nickname = player1;
  this.player[player1].hand = new Hand();
  this.player[player1].picked = 0;
  this.player[player1].viewing = this.deck.deal();

  this.player[player2] = {};
  this.player[player2].nickname = player2;
  this.player[player2].hand = new Hand();
  this.player[player2].picked = 0;
  this.player[player2].viewing = this.deck.deal();

};

Pickem.prototype.keep = function (player, isKeep) {
  if ((this.player[player] !== null) && (this.player[player].picked < 13)) {
    if (isKeep) {
      this.player[player].hand.draw(this.player[player].viewing);
      if (this.isPass) {
        this.player[this.opponent(player)].hand.draw(this.deck.deal());
      }
    } else {
      this.player[player].hand.draw(this.deck.deal());
      if (this.isPass) {
        this.player[this.opponent(player)].hand.draw(this.player[player].viewing);
      }
    }
    this.player[player].picked++;
    if (this.player[player].picked < 13) {
      this.player[player].viewing = this.deck.deal();
    } else {
      this.player[player].viewing = null;
    }
  }
};

Pickem.prototype.opponent = function (player) {
  var players = Object.keys(this.player);
  if (players.indexOf(player) === 0) {
    return players[1];
  } else {
    return players[0];
  }
};

Pickem.prototype.status = function (player) {
  if (this.player[player] !== null) {
    var status = {};
    status.player = {};
    status.player.nickname = player;
    status.player.viewing = this.player[player].viewing !== null ? this.player[player].viewing.img() : 'black_joker.png';
    status.player.value = this.player[player].viewing !== null ? this.player[player].viewing.value : null;
    status.player.hand = this.player[player].hand.count();
    status.player.picked = this.player[player].picked;
    status.opponent = {};
    status.opponent.nickname = this.opponent(player);
    status.opponent.picked = this.player[this.opponent(player)].picked;
    status.opponent.hand = this.player[this.opponent(player)].hand.count();
    status.deck = this.deck.size();
    status.gametype = this.isPass ? "Pickem & Pass" : "Pickem & Discard";
    return status;
  } else {
    return null;
  }
};

Pickem.prototype.warInfo = function () {
  var player = Object.keys(this.player);
  return [{
            "user":this.player[player[0]].nickname,
            "hand":this.player[player[0]].hand
          },{
            "user":this.player[player[1]].nickname,
            "hand":this.player[player[1]].hand
          }];
};

module.exports = Pickem;
