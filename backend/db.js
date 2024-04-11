const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://Shrashti:Srishti%40123@cluster0.c0kcs4d.mongodb.net/paytm"
);

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
  firstName: String,
  lastName: String,
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
