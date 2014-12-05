var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var historySchema = new Schema({
  winner: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  loser: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('History', historySchema);
