/**
 * Hand Object Type
 * Author: Michael Cebrian
 * Date: 09/06/2014
 * Description: A hand is a collection of cards.
 **/

/**
 * Requires Card Object Type
 **/
var Card = require('./card');

/**
 * new Hand(); 
 * Starts as an empty array of cards.
 **/
var Hand = function () {
  this.cards = [];
};

/**
 * Shuffle Hand Randomly.
 **/
Hand.prototype.shuffle = function () {
  for (var i = 0; i < this.cards.length; i++) {
    var rand = Math.floor(Math.random() * this.cards.length);
    var temp = this.cards[i];
    this.cards[i] = this.cards[rand];
    this.cards[rand] = temp;
  }
};

/**
 * Returns amount of cards in hand. 
 **/
Hand.prototype.length = function () {
  return this.cards.length;
};

/**
 * Returns amount of cards in hand. 
 **/
Hand.prototype.count = function () {
  return this.cards.length;
};

/**
 * Add a card to the hand.
 **/
Hand.prototype.draw = function (card) {
  if (card instanceof Card) {
    this.cards.push(card);
  } else {
    throw TypeError("Invalid Card! Cannot Draw!");
  }
};

/**
 * Add a card to the hand.
 **/
Hand.prototype.push = function (card) {
  if (card instanceof Card) {
    this.cards.push(card);
  } else {
    throw TypeError("Invalid Card! Cannot Draw!");
  }
};


/**
 * Play a card out of the hand.
 * Removes card from hand.
 * Returns played card.
 * If no cards exist it will return unidentified null.
 **/
Hand.prototype.play = function () {
  return this.cards.shift();
};

/**
 * Play a card out of the hand.
 * Removes card from hand.
 * Returns played card.
 * If no cards exist it will return unidentified null.
 **/
Hand.prototype.shift = function () {
  return this.cards.shift();
};

/**
 * Export Hand Object Type
 **/
module.exports = Hand;