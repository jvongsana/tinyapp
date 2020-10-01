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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const emailExist = email => {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

// GET

app.get("/", (req, res) => { // root
  res.send(`Hello!`);
});

app.get("/register", (req, res) => { // list of all urls in database
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => { // list of all urls in database
  const templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] };
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { // create new shorturl
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => { //short url info page
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => { //json for database
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => { //redirecting with  using shorturl
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// POST

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send('Incorrect email or password');
  }
  if (emailExist(req.body.email)) {
    res.status(400);
    res.send('Email already registered');
  }

  let newID = generateRandomString();
  users[newID] = newID;
  users[newID] = {
    id: newID,
    email: req.body.email,
    password: req.body.password
  };

  res.redirect('/urls');
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
  const email = req.body.email;
  const password = req.body.password;

  for (const user in users) {
    if (users[user].email === email && users[user].password === password) {
      res.cookie('user_id', users[user].id);
      res.redirect("/urls",);
    }
  }

  if (!req.cookies['user_id']) {
    res.status(400);
    res.send('Email address or password is incorrect');
  }
});

app.post("/logout", (req, res) => { // logout and delete username cookie
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => { // listening port
  console.log(`Example app listening on port ${PORT}!`);
});