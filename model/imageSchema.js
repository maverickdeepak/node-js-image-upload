const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  imageUrl: String,
});

module.exports = mongoose.model("Picture", imageSchema);
