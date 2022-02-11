const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const DaySchema = new Schema({
  date: {
    type : String,
    required:true,
    index: true
  },
  log: [{
    type: String,
  }],
  calories: {
    type: Number,
    required:true
  },
  id: {
    type: String,
    index: true,
    required:true
  }
});

const Day = mongoose.model("Day", DaySchema);



module.exports.Day = Day;
