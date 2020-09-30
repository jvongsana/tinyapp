const { response } = require('express');
const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

const generateRandomString = () => { // generates random string for shorturl
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const uniqueStrLength = 6;
  let uniqueString = '';

  for (let i = 0; i < uniqueStrLength; i++) {
    uniqueString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return uniqueString;
};

const urlDatabase = { // shorturl - longurl key value pairs
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.ca"
};

app.get("/", (req, res) => { // root
  res.send(`Hello!`);
});

app.get("/urls", (req, res) => { // list of all urls in database
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { // create new shorturl
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => { //short url info page
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => { //json for database
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => { //redirecting with  using shorturl
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => { // redirects to new url posted
  let uniquieRedirect = generateRandomString();
  urlDatabase[uniquieRedirect] = req.body.longURL;
  res.redirect(302, `/urls/${uniquieRedirect}`);
});

app.post("/urls/:shortURL/edit", (req, res) => { // Edits url longURL from shortURL page
  const url = req.params.shortURL;
  const newURL = req.body.name;
  urlDatabase[url] = newURL;
  res.redirect(`/urls/${url}`);
});

app.post("/urls/:shortURL/delete", (req, res) => { // Delete shortURL: longURL entries
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => { // login with username
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect("/urls",);
});

app.post("/logout", (req, res) => { // logout and delete username cookie
  res.clearCookie("username");
  res.redirect("/urls",);
});

app.listen(PORT, () => { // listening port
  console.log(`Example app listening on port ${PORT}!`);
});