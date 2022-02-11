const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const FoodItemSchema = new Schema({
  name: {
    type: String,
    required:true
  },
  calories: {
    type: Number,
    required: true
  },
  id: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type : String
  }
  // ,
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   required:true
  // }
});

const FoodItem = mongoose.model("FoodItem", FoodItemSchema);


module.exports.FoodItem = FoodItem;
