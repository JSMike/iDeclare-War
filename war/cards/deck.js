/**
 * Deck Object Type
 * Author: Michael Cebrian
 * Date: 09/06/2014
 * Description: A deck of playing cards. Standard 52 card deck.
 **/
 
/**
 * Requires Card Object Type.
 **/
var Card = require('./card');

/**
 * new Deck();
 * Creates array of 52 cards. One of each type and suit.
 **/
var Deck = function() {
  this.cards = [];
  for (var i = 1; i <= 13; i++) {
    for (var l = 1; l <= 4; l++) {
      this.cards.push(new Card(i,l));
    }
  }
};

/**
 * Shuffle Deck Randomly.
 **/
Deck.prototype.shuffle = function () {
  for (var i = 0; i < this.cards.length; i++) {
    var rand = Math.floor(Math.random() * this.cards.length);
    var temp = this.cards[i];
    this.cards[i] = this.cards[rand];
    this.cards[rand] = temp;
  }
};

/**
 * Take top card out of deck.
 * Return card.
 **/
Deck.prototype.shift = function () {
  return this.cards.shift();
};

/**
 * Take top card out of deck.
 * Return card.
 **/
Deck.prototype.deal = function () {
  return this.shift();
};

/**
 * Add card to bottom of deck.
 **/
Deck.prototype.push = function (card) {
  this.cards.push(card);
}

/**
 * Returns count of remaining cards.
 **/
Deck.prototype.size = function () {
  return this.cards.length;
};

/**
 * Returns count of remaining cards.
 **/
Deck.prototype.length = function () {
  return this.cards.length;
};

/**
 * Exports Deck Object Type.
 **/
module.exports = Deck;