var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(express.static('public'));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
// body-parser "makes req.body exist"
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "0": {
    id: "0", 
    email: "a@a.com", 
    password: "123"
  },
 "1": {
    id: "1", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  if (req.cookies["user_id"]) {
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
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users: users
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users: users
  };
  if (typeof req.cookies["user_id"] != "undefined") {
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/login");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users: users
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let key = req.params.shortURL;
  if (!urlDatabase[key]) {
    res.statusCode = 404;
    console.log("Doesn't exist.");
    return;
  }
  let longURL = urlDatabase[key];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users: users
  };
  res.render("urls_register", templateVars);
});

app.post("/urls", (req, res) => {
  let templateVars = {
    origin: req.headers.origin
  }

  let string = generateRandomString();
  while (string in urlDatabase) {
    string = generateRandomString();
  }
  urlDatabase[string] = req.body.longURL
  console.log(urlDatabase);
  console.log("url: ", req.headers.origin);
  // "u/" + string;
  res.redirect("/urls/" + string);
  // res.redirect("u/" + string);
});

app.post("/urls/:id/delete", (req, res) => {
  // console.log(req.params.id);
  delete urlDatabase[req.params.id];

  // TODO change render to redirect (Always redirect when handling a POST request)
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  const newURL = req.body.longURL;
  urlDatabase[req.params.id] = newURL;
  // TODO change render to redirect (Always redirect when handling a POST request)
  console.log(urlDatabase);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  for (user in users) {
    if (users[user].email === email && users[user].password === password) {
      console.log("Match found")
      res.cookie("user_id", users[user].id);
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
  res.clearCookie("user_id");
  res.redirect("/urls/");
});

let USER_INDEX = 1;
app.post("/register", (req, res) => {
  let user_id = USER_INDEX;
  let email = req.body.email;
  let password = req.body.password;
  
  if (email === "" || password === "") {
    res.sendStatus(400);
    console.log("Email or password fields can't be empty!");
    return;
  }
  
  for (user in users) {
    if (users[user].email === email) {
      res.sendStatus(400);
      console.log("Email already exists.");
      // console.log(res.statusCode);
      return;
    }
  }
  
  USER_INDEX++; // needs to increase after the checks

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


function generateRandomString() {
  // For base-77 conversion:
  const _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~!$&'()*+,;=".split("");
  let output = [];
  for (let i = 0; i < 6; i++) {
    x = Math.floor(Math.random() * 77);
    output.push(_keyStr[x]);
  }
  return output.join("");
}
