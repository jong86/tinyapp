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
    userID: "0"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "1"
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
    statusText: ""
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  let urlsOfUser = urlsForUser(req.session["user_id"]);
  let templateVars = { 
    urls: urlsOfUser,
    user_id: req.session["user_id"],
    users: users
  };
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
  res.redirect("/login");
});

app.get("/urls/:id", (req, res) => {
  let shortKey = req.params.id;
  if (urlDatabase[shortKey].userID === req.session["user_id"]) {
    let templateVars = { 
      shortURL: req.params.id,
      urls: urlDatabase,
      user_id: req.session["user_id"],
      users: users
    };
    res.render("urls_show", templateVars);
    return;
  }
  res.sendStatus(403);
});

app.get("/u/:shortURL", (req, res) => {
  let shortKey = req.params.shortURL;
  if (!urlDatabase[shortKey]) {
    res.statusCode = 404;
    console.log("Doesn't exist.");
    return;
  }
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
  res.render("urls_register", templateVars);
});




app.post("/urls", (req, res) => {
  let templateVars = {
    origin: req.headers.origin
  }
  let shortKey = generateRandomString();
  while (shortKey in urlDatabase) {
    shortKey = generateRandomString();
  }
  urlDatabase[shortKey] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"]
  };
  console.log(urlDatabase);
  console.log("url: ", req.headers.origin);
  res.redirect("/urls/" + shortKey);
});

app.post("/urls/:id/delete", (req, res) => {
  let shortKey = req.params.id
  // Ensures that url belongs to user:
  if (urlDatabase[shortKey].userID === req.session["user_id"]) {
    delete urlDatabase[shortKey];
    res.redirect("/urls");
    return;
  }
  console.log("Cannot delete url if it doesn't belong to you.");
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  let shortKey = req.params.id;
  // Ensures that url belongs to user:
  if  (urlDatabase[shortKey] && urlDatabase[shortKey].userID === req.session.user_id) {
    const newURL = req.body.longURL;
    urlDatabase[req.params.id] = {
      longURL: req.body.longURL,
      userID: urlDatabase[shortKey].userID
    }
    console.log(urlDatabase);
    res.redirect("/urls");
    return;
  }
  console.log("Cannot update url if it doesn't belong to you.");
  res.redirect("/urls");
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
    statusText: "Email and password combination not found."
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
    res.sendStatus(400);
    console.log("Email or password fields can't be empty!");
    return;
  }
  let user_id = USER_INDEX;
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, 10);
  for (user in users) {
    if (users[user].email === email) {
      res.sendStatus(400);
      console.log("Email already exists.");
      return;
    }
  }
  
  USER_INDEX++; // Needs to increase after the checks
  users[USER_INDEX] = {
    id: USER_INDEX, 
    email: email,
    password: password
  };
  res.cookie("user_id", users[USER_INDEX].id);
  console.log(users);
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});

