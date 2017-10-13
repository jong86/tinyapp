let mod_funcs = require("./module_functions");
const bcrypt = require("bcrypt");

let DB_URLS = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    userID: "0",
    dateCreated: mod_funcs.getDate(),
    numVisits: 7,
    visitorIPs: [],
    numUniqueVisits: 5
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "1",
    dateCreated: mod_funcs.getDate(),
    numVisits: 6,
    visitorIPs: [],
    numUniqueVisits: 2
  }
};

let DB_USERS = { 
  "0": {
    id: "0", 
    email: "a@a.com", 
    password: bcrypt.hashSync("123", 10)
  },
 "1": {
    id: "1", 
    email: "b@b.com", 
    password: bcrypt.hashSync("123", 10)
  }
}


module.exports = {
  DB_URLS,
  DB_USERS
};