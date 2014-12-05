/**
 * War Game
 * Author: Michael Cebrian
 * Date: 09/19/2014
 * Description: Runs a game of War between two players. Gives current status and moves to next turn.
 **/

var Deck = require('./cards/deck');
var Hand = require('./cards/hand');
//var Player = require('./player');

/**
 * Start new instance of War between 2 players.
 * Use new deck, shuffle it, and distribute between the two players.
 * Sets newGame flag.
 **/
var War = function (player1, player2) {
  if (typeof player1 === 'string') {
    this.player = [{ "user": player1,
                     "hand": new Hand() },
                   { "user": player2,
                     "hand": new Hand() }];
    var myDeck= new Deck();
    myDeck.shuffle();

    while (myDeck.length() > 0) {
      this.player[0].hand.draw(myDeck.deal());
      this.player[1].hand.draw(myDeck.deal());
    }
  } else {
    this.player = [];
    this.player[0] = player1;
    this.player[1] = player2;

    this.player[0].hand.shuffle();
    this.player[1].hand.shuffle();
  }

  this.pool = new Hand();
  this.newGame = true;
  this.isWar = false;
  this.winner = null;
  this.loser = null;
};


/**
 * Plays the next turn of the game.
 * If first turn it will remove the newGame flag and each player will play their nextCard.
 * If not first turn, looks at the last card played to determine winner of last turn or if time for war.
 * If winner, give both cards to winer and each person play a card. If one player is out of cards the set winner flag.
 * If tied then start war.
 **/
War.prototype.nextTurn = function () {
  if (this.newGame === true) {
    this.newGame = false;
    this.nextCard();
  } else if (this.player[0].card.compare(this.player[1].card) === 0) {
    this.war();
    this.isWar = true;
  } else {
    this.isWar = false;
    if (this.player[0].card.compare(this.player[1].card) === 1) {
      if (this.player[1].hand.count() === 0) {
        this.winner = this.player[0].user;
        this.loser = this.player[1].user;
        return;
      }

      this.player[0].hand.draw(this.player[0].card);
      this.player[0].hand.draw(this.player[1].card);
      while (this.pool.count() > 0) {
        this.player[0].hand.draw(this.pool.shift());
      }
    } else {
      if (this.player[0].hand.count() === 0) {
        this.winner = this.player[1].user;
        this.loser = this.player[0].user;
        return;
      }
      this.player[1].hand.draw(this.player[0].card);
      this.player[1].hand.draw(this.player[1].card);
      while (this.pool.count() > 0) {
        this.player[1].hand.draw(this.pool.shift());
      }
    }
    this.nextCard();
  }
};

/**
 * If they player has cards still then play the next card out of their hand.
 * If player is playing their last card, keep it on the table, do not replace it.
 **/
War.prototype.nextCard = function () {
  if (this.player[0].hand.count() !== 0) {
    this.player[0].card = this.player[0].hand.play();
  }

  if (this.player[1].hand.count() !== 0) {
    this.player[1].card = this.player[1].hand.play();
  }
};

/**
 * Places each players last card played into pool if they have cards still.
 * Places next 3 cards from each players hand into pool unless they get down to their last card.
 * Plays next card unless there are none left.
 **/
War.prototype.war = function () {
  //Users last card will stay
  if (this.player[0].hand.count() !== 0 ) {
    this.pool.draw(this.player[0].card);
  }
  if (this.player[1].hand.count() !== 0 ) {
    this.pool.draw(this.player[1].card);
  }
  for (var i = 0; i < 3; i++) {
    if (this.player[0].hand.count() > 1 ) {
      this.pool.draw(this.player[0].hand.play());
    }

    if (this.player[1].hand.count() > 1 ) {
      this.pool.draw(this.player[1].hand.play());
    }
  }
  this.nextCard();
};

/**
 * Returns the current status of the war.
 **/
War.prototype.status = function () {
  var data = {};
  data.player1 = {};
  data.player1.name = this.player[0].user;
  data.player1.card = this.player[0].card.img();
  data.player1.count = this.player[0].hand.count();

  data.player2 = {};
  data.player2.name = this.player[1].user;
  data.player2.card = this.player[1].card.img();
  data.player2.count = this.player[1].hand.count();

  data.pool = this.isWar ? this.pool.count() - 6 : 0;
  data.isWar = this.isWar;
  data.winner = this.winner;
  data.loser = this.loser;
  return data;
};

module.exports = War;
