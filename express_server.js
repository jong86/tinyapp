// TODO: Implement unique visits using IP


//
// Dependencies:
//

const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.set('trust proxy', 1);

app.use(express.static('public'));

const cookieSession = require("cookie-session");

require('dotenv').config();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require("bcrypt");

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const mod_data = require("./module_data");
const mod_funcs = require("./module_functions");
const mod_const = require("./module_constructors");


//
// Routing:
//


app.use(cookieSession({ // For encrypted cookies
  name: 'session',
  // Define these keys with .env file:
  keys: [process.env.COOKIE_KEY1, process.env.COOKIE_KEY2, process.env.COOKIE_KEY3],
  // Cookie Options:
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



//
// "Get" request handling:

app.get("/", (req, res) => {
  if (typeof req.session.user_id !== "undefined") {
    res.redirect("/urls");
    return;
  } 
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const urlsOfUser = mod_funcs.urlsForUser(req.session["user_id"], mod_data.DB_URLS);
  const templateVars = { 
    urls: urlsOfUser,
    user_id: req.session["user_id"],
    host: req.headers.host,
    users: mod_data.DB_USERS,
    isEmpty: function(obj) {
      for(var key in obj) {
        if(obj.hasOwnProperty(key))
        return false;
      }
      return true;
    }
  };
  if (typeof req.session["user_id"] === "undefined") {
    templateVars.message = "Not logged in. Click above to log in or register.";
    res.render("urls_message", templateVars);
    return;
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    urls: mod_data.DB_URLS,
    user_id: req.session["user_id"],
    users: mod_data.DB_USERS
  };
  if (typeof req.session["user_id"] !== "undefined") {
    res.render("urls_new", templateVars);
    return;
  }
  templateVars.message = "You must be logged in to create new short URLs.";
  res.render("urls_login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const shortKey = req.params.id;
  const templateVars = { 
    shortURL: req.params.id,
    urls: mod_data.DB_URLS,
    user_id: req.session["user_id"],
    users: mod_data.DB_USERS,
    host: req.headers.host
  };
  if (typeof req.session["user_id"] === "undefined") { // Checks if user is logged in
    templateVars.message = "You must be logged in to view short URL info pages."
    res.render("urls_message", templateVars);
    return;
  }
  if (typeof mod_data.DB_URLS[shortKey] === "undefined") { // Checks if short url exists
    templateVars.message = "This short URL does not exist."
    res.render("urls_message", templateVars);
    return;
  }
  if (mod_data.DB_URLS[shortKey].userID !== req.session["user_id"]) { // Checks if user owns the url
    templateVars.message = "You are not the owner of this short URL and therefore do not have permission to access it's page.";
    res.render("urls_message", templateVars);
    return;
  }
  res.render("urls_show", templateVars);
});

let ANON_COUNTER = 0;
app.get("/u/:shortURL", (req, res) => {
  const shortKey = req.params.shortURL;
  if (typeof mod_data.DB_URLS[shortKey] === "undefined") { // Checks if short url exists
    const message = `The short URL ${shortKey} does not exist.`
    res.render("urls_message", { message: message });
    return;
  }
  mod_data.DB_URLS[shortKey].numVisits++;
  let visitorID;
  // Create anon_id cookie if user not logged in and is a new visitor:
  if (typeof req.session["user_id"] === "undefined" && typeof req.session["anon_id"] === "undefined") {
    req.session.anon_id = "ANON" + ANON_COUNTER;
    ANON_COUNTER++;
    visitorID = req.session.anon_id;
  } else {
    visitorID = req.session.user_id
  }
  
  if (typeof req.session["user_id"] !== "undefined") {
    visitorID = req.session["user_id"];
  } else {
    visitorID = req.session["anon_id"];
  }
  if (mod_data.DB_URLS[shortKey].visitorIDList.includes(visitorID) === false) { // Checks if user has visited that short URL before to add unique visitor
    mod_data.DB_URLS[shortKey].visitorIDList.push(visitorID);
  } 
  mod_data.DB_URLS[shortKey].numUniqueVisits = mod_data.DB_URLS[shortKey].visitorIDList.length;
  console.log(mod_data.DB_URLS[shortKey]);
  res.redirect(mod_data.DB_URLS[shortKey].longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { 
    shortURL: req.params.id,
    urls: mod_data.DB_URLS,
    user_id: req.session["user_id"],
    users: mod_data.DB_USERS
  };
  if (typeof req.session["user_id"] === "undefined") { // Checks if user is logged in
    res.render("urls_register", templateVars);
    return;
  }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (typeof req.session["user_id"] === "undefined") { // Checks if user is logged in
    res.render("urls_login");
    return;
  }
  res.redirect("/urls");
});

app.get("/logout", (req, res) => {
  // TODO disallow logout button from clearing cookie if the user is an ANON user
  // TODO need to set a seperate, unenrypted cookie to keep track of the ANON users
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (typeof req.session["user_id"] === "undefined") { // If user not logged in
    const message = "You must be logged in to make new URLs."
    res.render("urls_message", { message: message });
    return;
  }
  let shortKey = mod_funcs.generateRandomString();
  while (shortKey in mod_data.DB_URLS) {
    shortKey = mod_funcs.generateRandomString();
  }
  mod_data.DB_URLS[shortKey] = new mod_const.URL(req.body.longURL, req.session["user_id"]);
  res.redirect("/urls/" + shortKey);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // To find the match in user database:
  for (user in mod_data.DB_USERS) {
    if (mod_data.DB_USERS[user].email === email && bcrypt.compareSync(password, mod_data.DB_USERS[user].password)) {
      req.session.user_id = mod_data.DB_USERS[user].id;
      res.redirect("/");
      return;
    }
  }
  const errorText = "Email/password combination not found."
  res.render("urls_login", { errorText: errorText });
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

let USER_INDEX = 1; // For assigning unique/incrementing user IDs
app.post("/register", (req, res) => {
  // Check if form was filled out properly:
  if (req.body.email === "" && req.body.password === "") {
    const errorMessage = "Email and password fields can't be empty!";
    res.render("urls_register", { errorMessage: errorMessage });
    return;
  }
  if (req.body.email === "") {
    const errorMessage = "Email field can't be empty!";
    res.render("urls_register", { errorMessage: errorMessage });
    return;
  }
  if (req.body.password === "") {
    const errorMessage = "Password field can't be empty!";
    res.render("urls_register", { errorMessage: errorMessage });
    return;
  }
  // If everything is okay then create new user:
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  for (user in mod_data.DB_USERS) {
    if (mod_data.DB_USERS[user].email === email) {
      const errorMessage = "Email already exists.";
      res.render("urls_register", { errorMessage: errorMessage });
      return;
    }
  }
  USER_INDEX++;
  const user_id = USER_INDEX;
  mod_data.DB_USERS[USER_INDEX] = new mod_const.User(USER_INDEX, email, password);
  req.session.user_id = mod_data.DB_USERS[USER_INDEX].id;
  res.redirect("/urls");
});

app.put("/urls/:id", (req, res) => {
  const shortKey = req.params.id;
  if (mod_data.DB_URLS[shortKey].userID !== req.session["user_id"]) {
    const message = "You are not the owner of this short URL and therefore do not have permission to access it's page.";
    res.render("urls_message", { message: message });
    return;
  }
  if (typeof req.session["user_id"] === "undefined") { // If user not logged in...
    const message = "You must be logged in to edit short URLs."
    res.render("urls_message", { message: message });
    return;
  }
  if  (mod_data.DB_URLS[shortKey] && mod_data.DB_URLS[shortKey].userID === req.session.user_id) { // Ensures that url belongs to user
    const newURL = req.body.longURL;
    mod_data.DB_URLS[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
    return;
  }
  console.log("Cannot update url if it doesn't belong to you.");
  res.redirect("/urls");
});

app.delete("/urls/:id", (req, res) => {
  const shortKey = req.params.id
  if (typeof req.session["user_id"] === "undefined") { // If user not logged in...
    const message = "You must be logged in to delete short URLs."
    res.render("urls_message", { message: message });
    return;
  }
  if (mod_data.DB_URLS[shortKey].userID !== req.session["user_id"]) { // If user is NOT the owner of the short URL
    const message = "You are not the owner of this short URL and therefore do not have permission to delete it.";
    res.render("urls_message", { message: message });
    return;
  }
  if (mod_data.DB_URLS[shortKey].userID === req.session["user_id"]) {   // If user is owner of URL
    delete mod_data.DB_URLS[shortKey];
    res.redirect("/urls");
    return;
  }
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});