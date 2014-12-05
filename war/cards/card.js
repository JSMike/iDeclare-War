/**
 * Card Object Type
 * Author: Michael Cebrian
 * Date: 09/06/2014
 * Description: Object of single playing card.
 **/
 
/**
 * new Card(value,suit);
 * Creates instance of card if valid value and suit are passed.
 **/
var Card = function (value,suit) {
      value = String(value).toLowerCase();
      suit = String(suit).toLowerCase();
      //Check for valid input. Throw error if invalid.
      if ((value in {'1':1, '2':1, '3':1, '4':1, '5':1, '6':1, 
          '7':1, '8':1, '9':1, '10':1, '11':1, '12':1, '13':1, '14':1, 
          'j':1, 'q':1, 'k':1, 'a':1,
          'jack':1, 'queen':1, 'king':1, 'ace':1}) && 
          (suit in {'&diams;':1, '&clubs;':1, '&hearts;':1, '&spades;':1,
            '1':1, '2':1, '3':1, '4':1, 
            'd':1, 'c':1, 'h':1, 's':1,
            'diamonds':1, 'clubs':1, 'hearts':1, 'spades':1})) {
        //Valid input! Now set value and suit of this card.
        switch (value) {
          case '1':
          case '14':
          case 'a':
          case 'ace':
              this.value = 14;
            break;
          case '2':
              this.value = 2;
            break;  
          case '3':
              this.value = 3;
            break;  
          case '4':
              this.value = 4;
            break;
          case '5':
              this.value = 5;
            break;
          case '6':
              this.value = 6;
            break;
          case '7':
              this.value = 7;
            break;
          case '8':
              this.value = 8;
            break;  
          case '9':
              this.value = 9;
            break;
          case '10':
              this.value = 10;
            break;  
          case '11':
          case 'j':
          case 'jack':
              this.value = 11;
            break;  
          case '12':
          case 'q':
          case 'queen':
              this.value = 12;
            break;  
          case '13':
          case 'k':
          case 'king':
              this.value = 13;
            break;
        }

        switch (suit) {
          case '&diams;':
          case '1':
          case 'd':
          case 'diamonds':
              this.suit = 1;
            break;
          case '&clubs;':
          case '2':
          case 'c':
          case 'clubs':
              this.suit = 2;
            break;
          case '&hearts;':
          case '3':
          case 'h':
          case 'hearts':
              this.suit = 3;
            break;
          case '&spades;':
          case '4':
          case 's':
          case 'spades':
              this.suit = 4;
            break;
        }
      } else {
        throw new RangeError("Invalid Card Data!");   
      }
    };
    
/**
 * Compares other card with this card/.
 * If this card = passed card then return 0;
 * If this card > passed card return 1;
 * If this card < passed card return -1;
 * Optional useSuit parameter for if suit is to be counted
 * Suit value lowest to greatest: diamond, club, heart, spade
 **/
Card.prototype.compare = function (card, useSuit) {
  useSuit = typeof useSuit !== 'undefined' ? useSuit : false;
  
  if (this.value == card.value) {
    if (useSuit) {
      if (this.suit == card.suit) {
        return 0;
      } else if (this.suit > card.suit) {
        return 1;
      } else {
        return -1;
      }
    } else {
     return 0; 
    }
  } else if (this.value > card.value) {
    return 1;
  } else {
    return -1;
  }
};

/**
 * returns ascii value of card.
 **/
Card.prototype.ascii = function () {
  var value = String(this.value);
  var suit;
  switch (this.value) {
    case 11: value = 'J';
      break;
    case 12: value = 'Q';
      break;
    case 13: value = 'K';
      break;
    case 14: value = 'A';
      break;
  }
  switch (this.suit) {
    case 1: suit = '&diams;';
      break;
    case 2: suit = '&clubs;';
      break;
    case 3: suit = '&hearts;';
      break;
    case 4: suit = '&spades;';
      break;
  }
  return value.concat(suit);
};

/**
 * returns image path for card
 **/
Card.prototype.img = function() {
  return this.name().split(' ').join('_') + '.png'; 
};

/**
 * returns spelled out name of card
 **/
Card.prototype.name = function() {
  var name = this.value;
  switch (this.value) {
    case 11: name = 'Jack';
      break;
    case 12: name = 'Queen';
      break;
    case 13: name = 'King';
      break;
    case 14: name = 'Ace';
      break;
  }
  switch (this.suit) {
    case 1: name += ' of Diamonds';
      break;
    case 2: name += ' of Clubs';
      break;
    case 3: name += ' of Hearts';
      break;
    case 4: name += ' of Spades';
      break;
  }
  return name;
};

/**
 * returns spelled out name of card
 **/
Card.prototype.svg = function() {
  var name = this.value;
  switch (this.value) {
    case 11: name = 'jack';
      break;
    case 12: name = 'queen';
      break;
    case 13: name = 'king';
      break;
    case 14: name = 'ace';
      break;
  }
  switch (this.suit) {
    case 1: name += '_diamond';
      break;
    case 2: name += '_club';
      break;
    case 3: name += '_heart';
      break;
    case 4: name += '_spade';
      break;
  }
  return name;
};

/**
 * Returns ascii face value of card.
 **/
Card.prototype.faceValue == function () {
  var faceValue = this.value;
  switch (this.value) {
    case 11: faceValue ='J';
      break;
    case 12: faceValue ='Q';
      break;
    case 13: faceValue ='K';
      break;
    case 14: faceValue ='A';
      break;
  }
  return faceValue;
};

/**
 * Exports Card Object Type.
 **/
module.exports = Card;