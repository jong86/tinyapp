// TODO: Add visitor list with timestamps for each URL and display it on URL edit page


//
// Dependencies:
//

require('dotenv').config();

const express = require("express");
const cookieSession = require("cookie-session");

const app = express();

const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");

app.set("view engine", "ejs");
app.set('trust proxy', 1);

const modData = require("./module_data");
const modFuncs = require("./module_functions");
const modConst = require("./module_constructors");


//
// Routing:
//

app.use(express.static('public'));

app.use(methodOverride("_method"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieSession({ // For encrypted cookies
  name: 'session',
  // Define these keys with .env file:
  keys: [process.env.COOKIE_KEY1, process.env.COOKIE_KEY2, process.env.COOKIE_KEY3],
  // Cookie Options:
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  } 
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  console.log(req.session);
  if (!req.session.user_id) {
    const message = "Not logged in. Click above to log in or register.";
    res.render("urls_message", { message });
    return;
  }
  const urlsOfUser = modFuncs.urlsForUser(req.session.user_id, modData.DB_URLS);
  const templateVars = {
    urls: urlsOfUser,
    user_id: req.session.user_id,
    host: req.headers.host,
    email: modData.DB_USERS[req.session.user_id].email
    }
  console.log("urls:", templateVars.urls);
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    message = "You must be logged in to create new short URLs.";
    res.render("urls_login", { message });
    return;
  }
  const templateVars = { 
    user_id: req.session.user_id,
    users: modData.DB_USERS,
    email: modData.DB_USERS[req.session.user_id].email
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) { // Checks if user is logged in
    message = "You must be logged in to view short URL edit pages."
    res.render("urls_message", { message });
    return;
  }
  const shortKey = req.params.id;
  if (!modData.DB_URLS[shortKey]) { // Checks if short url exists
    message = "This short URL does not exist."
    res.render("urls_message", { message });
    return;
  }
  if (modData.DB_URLS[shortKey].userID !== req.session.user_id) { // Checks if user owns the url
    message = "You are not the owner of this short URL and therefore do not have permission to access it's page.";
    res.render("urls_message", { message });
    return;
  }
  const templateVars = { 
    shortURL: req.params.id,
    urls: modData.DB_URLS,
    user_id: req.session.user_id,
    users: modData.DB_USERS,
    host: req.headers.host,
    email: modData.DB_USERS[req.session.user_id].email
  };
  res.render("urls_show", templateVars);
});


let ANON_COUNTER = 0;
app.get("/u/:shortURL", (req, res) => {
  const shortKey = req.params.shortURL;
  if (!modData.DB_URLS[shortKey]) { // Checks if short url exists
    const message = `The short URL ${shortKey} does not exist.`
    res.render("urls_message", { message: message });
    return;
  }
  modData.DB_URLS[shortKey].numVisits++;
  

  let visitorID;
  // Create anon_id cookie if user not logged in and is a new visitor:
  if (!req.session.user_id && !req.session.anon_id) {
    req.session.anon_id = "ANON" + ANON_COUNTER;
    ANON_COUNTER++;
    visitorID = req.session.anon_id;
  } else {
    visitorID = req.session.user_id
  }

  if (req.session.user_id) {
    visitorID = req.session.user_id;
  } else {
    visitorID = req.session.anon_id;
  }
  if (modData.DB_URLS[shortKey].visitorIDList.includes(visitorID) === false) { // Checks if user has visited that short URL before to add unique visitor
    modData.DB_URLS[shortKey].visitorIDList.push(visitorID);
  } 
  modData.DB_URLS[shortKey].numUniqueVisits = modData.DB_URLS[shortKey].visitorIDList.length;
  res.redirect(modData.DB_URLS[shortKey].longURL);
});


app.get("/register", (req, res) => {
  if (!req.session.user_id) { // If user not logged in
    res.render("urls_register");
    return;
  }
  res.redirect("/urls");
});


app.get("/login", (req, res) => {
  if (!req.session.user_id) { // Checks if user is logged in
    res.render("urls_login");
    return;
  }
  res.redirect("/urls");
});


app.get("/logout", (req, res) => {
  if (req.session.user_id) {
    req.session.user_id = null;
  }
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  if (!req.session.user_id) { // If user not logged in
    const message = "You must be logged in to make new URLs."
    res.render("urls_message", { message });
    return;
  }
  let shortKey = modFuncs.generateRandomString();
  while (shortKey in modData.DB_URLS) {
    shortKey = modFuncs.generateRandomString();
  }
  modData.DB_URLS[shortKey] = new modConst.URL(req.body.longURL, req.session.user_id);
  res.redirect("/urls/" + shortKey);
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // To find the match in user database:
  for (user in modData.DB_USERS) {
    if (modData.DB_USERS[user].email === email && bcrypt.compareSync(password, modData.DB_USERS[user].password)) {
      req.session.user_id = modData.DB_USERS[user].id;
      res.redirect("/");
      return;
    }
  }
  const errorText = "Email/password combination not found."
  res.render("urls_login", { errorText });
});


app.post("/logout", (req, res) => {
  if (req.session.user_id) {
    req.session.user_id = null;
  }
  res.redirect("/urls");
});


let USER_INDEX = 1; // For assigning unique/incrementing user IDs
app.post("/register", (req, res) => {
  // Check if form was filled out properly:
  if (req.body.email === "" && req.body.password === "") {
    const errorMessage = "Email and password fields can't be empty!";
    res.render("urls_register", { errorMessage });
    return;
  }
  if (req.body.email === "") {
    const errorMessage = "Email field can't be empty!";
    res.render("urls_register", { errorMessage });
    return;
  }
  if (req.body.password === "") {
    const errorMessage = "Password field can't be empty!";
    res.render("urls_register", { errorMessage });
    return;
  }
  // If everything is okay then create new user:
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  for (user in modData.DB_USERS) {
    if (modData.DB_USERS[user].email === email) {
      const errorMessage = "Email already exists.";
      res.render("urls_register", { errorMessage });
      return;
    }
  }
  USER_INDEX++;
  const user_id = USER_INDEX;
  modData.DB_USERS[USER_INDEX] = new modConst.User(USER_INDEX, email, password);
  req.session.user_id = modData.DB_USERS[USER_INDEX].id;
  res.redirect("/urls");
});


app.put("/urls/:id", (req, res) => {
  const shortKey = req.params.id;
  if (modData.DB_URLS[shortKey].userID !== req.session.user_id) {
    const message = "You are not the owner of this short URL and therefore do not have permission to access it's page.";
    res.render("urls_message", { message });
    return;
  }
  if (!req.session.user_id) { // If user not logged in...
    const message = "You must be logged in to edit short URLs."
    res.render("urls_message", { message });
    return;
  }
  if (modData.DB_URLS[shortKey] && modData.DB_URLS[shortKey].userID === req.session.user_id) { // Ensures that url belongs to user
    const newURL = req.body.longURL;
    modData.DB_URLS[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
    return;
  }
  console.log("Cannot update url if it doesn't belong to you.");
  res.redirect("/urls");
});


app.delete("/urls/:id", (req, res) => {
  if (!req.session.user_id) { // If user not logged in...
    const message = "You must be logged in to delete short URLs."
    res.render("urls_message", { message: message });
    return;
  }
  const shortKey = req.params.id
  if (modData.DB_URLS[shortKey].userID !== req.session.user_id) { // If user is NOT the owner of the short URL
    const message = "You are not the owner of this short URL and therefore do not have permission to delete it.";
    res.render("urls_message", { message: message });
    return;
  }
  delete modData.DB_URLS[shortKey];
  console.log(modData.DB_URLS);
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});