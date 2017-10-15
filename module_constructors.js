const getDate = require("./module_functions").getDate;

function URL(longURL, userID) {
  this.longURL = longURL;
  this.userID = userID;
  this.dateCreated = getDate();
  this.numVisits = 0;
  this.visitorIDList = [];
  this.numUniqueVisits = 0;
  this.visitorTimestamps = [];
}

function User(id, email, password) {
  this.id = id;
  this.email = email;
  this.password = password
}

module.exports = {
  URL,
  User
}