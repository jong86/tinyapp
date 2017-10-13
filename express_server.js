//
// Dependencies:
//

var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.set('trust proxy', 1);

app.use(express.static('public'));

var cookieSession = require("cookie-session");

require('dotenv').config();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require("bcrypt");



//
// Data:
//

var urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    userID: "0",
    dateCreated: getDate(),
    numVisits: 7,
    visitorIPs: [],
    numUniqueVisits: 5
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "1",
    dateCreated: getDate(),
    numVisits: 6,
    visitorIPs: [],
    numUniqueVisits: 2
  }
};

const users = { 
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



//
// Functions:
//

function generateRandomString() {
  // For base-77 conversion:
  const _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~!$*+,;=".split("");
  let output = [];
  for (let i = 0; i < 6; i++) {
    x = Math.floor(Math.random() * _keyStr.length);
    output.push(_keyStr[x]);
  }
  return output.join("");
}

function urlsForUser(cookieUserID) {
  let outputDatabase = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === cookieUserID) {
      outputDatabase[url] = urlDatabase[url];
    }
  }
  return outputDatabase;
}

function getDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  if(dd<10){
      dd='0'+dd;
  } 
  if(mm<10){
      mm='0'+mm;
  } 
  var today = dd+'/'+mm+'/'+yyyy;
  return today;
}



//
// Begin routing:
//

app.use(cookieSession({
  name: 'session',
  // Define keys with .env file:
  keys: [process.env.COOKIE_KEY1, process.env.COOKIE_KEY2, process.env.COOKIE_KEY3],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



app.get("/", (req, res) => {
  if (typeof req.session.user_id !== "undefined") {
    res.redirect("/urls");
    return;
  } 
  
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  templateVars = {
    errorText: ""
  };

  if (typeof req.session["user_id"] === "undefined") { // If not logged in..
    res.render("urls_login", templateVars);
    return;
  }

  res.redirect("/urls"); // Redirects to /urls if user is logged in

});

app.get("/urls", (req, res) => {
  let urlsOfUser = urlsForUser(req.session["user_id"]);
  let templateVars = { 
    urls: urlsOfUser,
    user_id: req.session["user_id"],
    users: users,
    host: req.headers.host,
    isEmpty: function(obj) {
      for(var key in obj) {
          if(obj.hasOwnProperty(key))
              return false;
      }
      return true;
    }
  };
  
  if (typeof req.session["user_id"] === "undefined") { // If not logged in...
    templateVars.message = "Not logged in. Click above to log in or register.";
    res.render("urls_message", templateVars);
    return;
  }
  
  console.log(req.headers.host);

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.session["user_id"],
    users: users
  };
  if (typeof req.session["user_id"] != "undefined") {
    res.render("urls_new", templateVars);
    return;
  }
  templateVars.message = "You must be logged in to create new short URLs.";
  res.render("urls_login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let shortKey = req.params.id;
  let templateVars = { 
    shortURL: req.params.id,
    urls: urlDatabase,
    user_id: req.session["user_id"],
    users: users,
    host: req.headers.host
  };

  if (typeof req.session["user_id"] === "undefined") { // If user not logged in...
    templateVars.message = "You must be logged in to view short URL info pages."
    res.render("urls_message", templateVars);
    return;
  }

  if (typeof urlDatabase[shortKey] === "undefined") { // If short URL doesn't exist...
    templateVars.message = "This short URL does not exist."
    res.render("urls_message", templateVars);
    return;
  }

  if (urlDatabase[shortKey].userID === req.session["user_id"]) {
    res.render("urls_show", templateVars);
    return;
  }

  if (urlDatabase[shortKey].userID !== req.session["user_id"]) {
    templateVars.message = "You are not the owner of this short URL and therefore do not have permission to access it's page.";
    res.render("urls_message", templateVars);
  }

});

app.get("/u/:shortURL", (req, res) => {
  const shortKey = req.params.shortURL;
  if (typeof urlDatabase[shortKey] === "undefined") {
    let templateVars = {
      message: `The short URL ${shortKey} does not exist.`
    }
    res.render("urls_message", templateVars);
    return;
  }
  urlDatabase[shortKey].numVisits++;
  // const THIS_IP = res.remoteAddress;
  // for (let i = 0; i < urlDatabase[shortKey].visitorIPs.length; i++) {
  //   if (urlDatabase[shortKey].visitorIPs[i] === THIS_IP) {
  //     return;
  //   }
  // }
  // urlDatabase[shortKey].visitorIPs.push(THIS_IP);
  // urlDatabase[shortKey].numUniqueVisits++;
  res.redirect(urlDatabase[shortKey].longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    urls: urlDatabase,
    user_id: req.session["user_id"],
    users: users
  };
  if (typeof req.session["user_id"] === "undefined") {
    res.render("urls_register", templateVars);
    return;
  }
  res.redirect("/urls");
});




app.post("/urls", (req, res) => {
  if (typeof req.session["user_id"] === "undefined") { // If user not logged in...
    message = "You must be logged in to edit short URLs."
    res.render("urls_message", { message: message });
    return;
  }
  let templateVars = {
    origin: req.headers.origin
  }
  let shortKey = generateRandomString();
  while (shortKey in urlDatabase) {
    shortKey = generateRandomString();
  }
  urlDatabase[shortKey] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"],
    dateCreated: getDate(),
    numVisits: 0,
  };
  console.log(urlDatabase);
  console.log("url: ", req.headers.origin);
  res.redirect("/urls/" + shortKey);
});

app.post("/urls/:id", (req, res) => {
  let shortKey = req.params.id;

  if (urlDatabase[shortKey].userID !== req.session["user_id"]) {
    message = "You are not the owner of this short URL and therefore do not have permission to access it's page.";
    res.render("urls_message", { message: message });
    return;
  }

  if (typeof req.session["user_id"] === "undefined") { // If user not logged in...
    message = "You must be logged in to edit short URLs."
    res.render("urls_message", { message: message });
    return;
  }
  

  if  (urlDatabase[shortKey] && urlDatabase[shortKey].userID === req.session.user_id) { // Ensures that url belongs to user
    const newURL = req.body.longURL;
    // urlDatabase[req.params.id] = {
    //   longURL: req.body.longURL,
    //   userID: urlDatabase[shortKey].userID,
    // }
    urlDatabase[req.params.id].longURL = req.body.longURL;
    console.log(urlDatabase);
    res.redirect("/urls");
    return;
  }
  console.log("Cannot update url if it doesn't belong to you.");
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let shortKey = req.params.id

  if (typeof req.session["user_id"] === "undefined") { // If user not logged in...
    message = "You must be logged in to delete short URLs."
    res.render("urls_message", { message: message });
    return;
  }

  if (urlDatabase[shortKey].userID !== req.session["user_id"]) { // If user is NOT the owner of the short URL
    message = "You are not the owner of this short URL and therefore do not have permission to delete it.";
    res.render("urls_message", { message: message });
    return;
  }

  if (urlDatabase[shortKey].userID === req.session["user_id"]) {   // If user is owner of URL
    delete urlDatabase[shortKey];
    res.redirect("/urls");
    return;
  }

});


app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  for (user in users) {
    if (users[user].email === email && bcrypt.compareSync(password, users[user].password)) {
      console.log("Match found")
      req.session.user_id = users[user].id;
      res.redirect("/");
      return;
    }
  }

  templateVars = {
    errorText: "Email/password combination not found."
  };
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});

let USER_INDEX = 1; // For assigning unique/incrementing user IDs
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    errorMessage = "Email or password fields can't be empty!";
    console.log("Email or password fields can't be empty!");
    res.render("urls_register", { errorMessage: errorMessage });
    return;
  }
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, 10);
  for (user in users) {
    if (users[user].email === email) {
      console.log("Email already exists.");
      errorMessage = "Email already exists.";
      res.render("urls_register", { errorMessage: errorMessage });
      return;
    }
  }
  
  USER_INDEX++; // Needs to increase after the checks
  let user_id = USER_INDEX;
  users[USER_INDEX] = {
    id: USER_INDEX, 
    email: email,
    password: password
  };
  req.session.user_id = user_id;
  console.log(users);
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});

