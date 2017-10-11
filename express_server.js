var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(express.static('public'));


const bodyParser = require("body-parser");
// body-parser "makes req.body exist"
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
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
  res.redirect("urls/" + string);
  // res.redirect("u/" + string);
});

app.post("/urls/:id/delete", (req, res) => {
  // console.log(req.params.id);
  delete urlDatabase[req.params.id];

  // TODO change render to redirect (Always redirect when handling a POST request)
  res.redirect("/urls/");
});


app.post("/urls/:id/update", (req, res) => {
  const newURL = req.body.longURL;
  urlDatabase[req.params.id] = newURL;
  // TODO change render to redirect (Always redirect when handling a POST request)
  res.redirect("/urls/");
  console.log(urlDatabase);
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
