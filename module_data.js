const mod_funcs = require("./module_functions");
const bcrypt = require("bcrypt");

const DB_URLS = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    userID: "0",
    dateCreated: mod_funcs.getDate(),
    numVisits: 0,
    visitorIDList: [],
    numUniqueVisits: 0
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "1",
    dateCreated: mod_funcs.getDate(),
    numVisits: 0,
    visitorIDList: [],
    numUniqueVisits: 0
  }
};

const DB_USERS = { 
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