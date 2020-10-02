const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;
const { generateRandomString, createNewAccount, emailExist, urlsForUser, isLoginSuccessul } = require('./helpers');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['keySign', 'keyVerify']
}));

const urlDatabase = { // shortURL { longURL, userID }
  "b2xVn2": {
    "longURL": "http://www.lighthouselabs.ca",
    "userID": "userRandomID"
  },
  "9sm5xK": {
    "longURL": "http://www.google.ca",
    "userID": "user2RandomID"
  }
};

const users = { // userID { userID, email, password }
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$./g1J5PMoPNSRSC9Fr5pcOtBl/KtDDORIDZN9NS9RVZYEwstRJ2fu"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$8VjLcJOpp6p3UIgdswB/Su4aCOmwdB8eYqH1ufKeBcTZ3NKXqHoQm"
  }
};

app.get("/", (req, res) => { // Root redirect to Login
  const userIdCookie = req.session.user_id;
  
  if (!(userIdCookie in users)) {
    res.status(403);
    res.redirect(`/login`);
  } else {
    res.redirect('/urls');
  }
});

app.get("/register", (req, res) => { // Registration page
  const userIdCookie = req.session.user_id;
  const templateVars = { user: users[userIdCookie] };

  res.render("register", templateVars);
});

app.post("/register", (req, res) => { // Registers account if email or password are empty and email is not already registered
  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.status(400);
    res.send('Incorrect email or password').end();
  } else if (emailExist(email, users)) {
    res.status(400);
    res.send('Email already registered');
  } else {
    const newID = generateRandomString();
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);

    createNewAccount(newID, email, hashedPassword, users);

    // eslint-disable-next-line camelcase
    req.session.user_id = newID;
    res.redirect('/urls');
  }
});

app.get("/login", (req, res) => { // Login page
  const userIdCookie = req.session.user_id;
  const templateVars = { user: users[userIdCookie] };

  res.render("login", templateVars);
});

app.post("/login", (req, res) => { // Checks if email and password match existing user
  const { email, password } = req.body;
  const logInID = isLoginSuccessul(email, password, users);

  if (logInID) {
    // eslint-disable-next-line camelcase
    req.session.user_id = logInID;
    res.redirect("/urls");
  } else {
    res.status(401);
    res.send('Email address or password incorrect.');
  }
});

app.post("/logout", (req, res) => { // Logout and delete cookie session
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls", (req, res) => { // List of all URLs made by specificed user
  const userIdCookie = req.session.user_id;
  
  if (!(userIdCookie in users)) {
    res.status(401);
    res.send('Please log in to perform this action');
  }

  const templateVars = {
    user: users[userIdCookie],
    filteredURLs: urlsForUser(userIdCookie, urlDatabase)
  };

  if (templateVars.user !== undefined) {
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => { // Creats new URL and redirects to that shortURL page
  const userIdCookie = req.session.user_id;

  if (!(userIdCookie in users)) {
    res.status(401);
    res.send('Please log in to perform action');
  }
  
  let uniquieRedirect = generateRandomString();

  if (req.body.longURL === "") {
    res.status(400);
    res.send('URL invalid');
  } else {
    urlDatabase[uniquieRedirect] = {};
    urlDatabase[uniquieRedirect]['longURL'] = req.body.longURL;
    urlDatabase[uniquieRedirect]['userID'] = req.session.user_id;
    res.redirect(`/urls/${uniquieRedirect}`);
  }
});

app.get("/urls/new", (req, res) => { // Creates new shortURL
  const userIdCookie = req.session.user_id;
  const templateVars = {
    user: users[userIdCookie]
  };

  if (templateVars.user !== undefined) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => { // shortURL info page
  const userIdCookie = req.session.user_id;
  const shortURLid = req.params.shortURL;

  if (!(userIdCookie in users)) {
    res.status(401);
    res.send('Please log in to perform this action');
  }
  if (!urlDatabase[shortURLid]) { // URL does not exist in database
    res.status(404);
    res.send('Not a valid URL');
  }
  if (userIdCookie !== urlDatabase[shortURLid]['userID']) { // Logged in user does not have access to this url
    res.status(401);
    res.send('You do not have permissions to access this URL');
  }

  const filteredURLs = urlsForUser(userIdCookie, urlDatabase);
  const longURL = urlDatabase[shortURLid]['longURL'];
  const templateVars = {
    shortURL: shortURLid,
    longURL: longURL,
    user: users[userIdCookie]
  };
  if (shortURLid in filteredURLs) {
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortURL/edit", (req, res) => { // Edits url longURL of shortURL
  const userIdCookie = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!(userIdCookie in users)) {
    res.status(401);
    res.send('Please sign in to perform action');
  } else if (userIdCookie !== urlDatabase[shortURL]['userID']) {
    res.status(401);
    res.send('You do not have authorization to edit this URL');
  } else {
    const filteredURLs = urlsForUser(userIdCookie, urlDatabase);
    const url = req.params.shortURL;
    const newURL = req.body.name;
  
    filteredURLs[url]['longURL'] = newURL;
    res.redirect(`/urls/${url}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => { // Delete url entries
  const userIdCookie = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!(userIdCookie in users)) {
    res.status(401);
    res.send('Please sign in to perform action');
  } else if (userIdCookie !== urlDatabase[shortURL]['userID']) {
    res.status(401);
    res.send('You do not have authorization to edit this URL');
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

app.get("/u/:shortURL", (req, res) => { // Redirect to longURL with shortURL
  const shortURL = req.params.shortURL;

  if (shortURL in urlDatabase) {
    const longURL = urlDatabase[req.params.shortURL]['longURL'];
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send('Invalid URL');
  }
});

app.listen(PORT, () => { //
  console.log(`Tinyapp listening on port ${PORT}!`);
});