const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
// const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieSession({
//   name: 'session',
//   keys: ['keySign', 'keyVerify']
// }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());


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
    password: "$2y$10$il0mPf5Gtgy4Gq1Z77ik/e9zXchv3oyGtKB3SAi46lLaGhIC/Qe36"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2y$10$bOrOwHmw0rdZz7u170v7k.gWehSFwla/QsOo2eDLP1ExSZmNf.QsO"
  }
};

const generateRandomString = () => Math.random().toString(16).slice(2, 8);

const createNewAccount = (id, email, password) => { // Creates new User object in Users
  const hashedPassword = bcrypt.hashSync(password,10);
  users[id] = {
    id: id,
    email: email,
    password: hashedPassword
  };
};

const emailExist = email => { // Checks if email belongs to an existing user
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (id) => { // Returns object of all URLs made by specificed user
  let filteredURLs = {};
  for (const shortURL in urlDatabase) {
    const urlObj = urlDatabase[shortURL];

    if (urlObj.userID === id) {
      filteredURLs[shortURL] = urlObj;
    }
  }
  return filteredURLs;
};

// GET

app.get("/", (req, res) => { // root
  res.send(`Hello!`);
});

app.get("/register", (req, res) => { // Registration page
  const userIdCookie = req.cookies['user_id'];
  const templateVars = { user: users[userIdCookie] };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => { //Login page
  const userIdCookie = req.cookies['user_id'];
  const templateVars = { user: users[userIdCookie] };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => { // List of all URLs made by specificed user
  const userIdCookie = req.cookies['user_id'];
  const templateVars = {
    user: users[userIdCookie],
    filteredURLs: urlsForUser(userIdCookie)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { // Creates new shortURL
  const userIdCookie = req.cookies['user_id'];
  const templateVars = {
    user: users[userIdCookie],
    filteredURLs: urlsForUser(userIdCookie)
  };
  if (templateVars.user !== undefined) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
    res.end();
  }
});

app.get("/urls/:shortURL", (req, res) => { // shortURL page
  const userIdCookie = req.cookies['user_id'];
  const templateVars = {
    shortURL: req.params.shortURL,
    filteredURLs: urlsForUser(userIdCookie),
    user: users[userIdCookie]
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => { // Redirect to longURL with shortURL
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => { // Jsoon urlDatabse
  res.json(urlDatabase);
});
// POST

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send('Incorrect email or password').end();
  }
  if (emailExist(req.body.email)) {
    res.status(400);
    res.send('Email already registered');
  }
  const newID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  createNewAccount(newID, email, password);
  res.redirect('/urls');
});

app.post("/login", (req, res) => { // login with username
  const { email, password } = req.body;
  let loginSuccess = false;
  for (const user in users) {
    const existingUser = users[user];
    const existingPassword = existingUser.password;
    if (existingUser.email === email && bcrypt.compareSync(password, existingPassword)) {
      loginSuccess = true;
      res.cookie('user_id', existingUser.id);
      res.redirect("/urls");
    }
  }
  if (!loginSuccess) {
    res.status(400);
    res.send('Email address or password incorrect.');
  }
  
});

app.post("/logout", (req, res) => { // logout and delete username cookie
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls", (req, res) => { // redirects to new url posted
  let uniquieRedirect = generateRandomString();
  if (req.body.longURL === "") {
    res.status(400);
    res.send('URL invalid');
  } else {
    urlDatabase[uniquieRedirect] = {};
    urlDatabase[uniquieRedirect]['longURL'] = req.body.longURL;
    urlDatabase[uniquieRedirect]['userID'] = req.cookies['user_id'];
    res.redirect(302, `/urls/${uniquieRedirect}`);
  }
});

app.post("/urls/:shortURL/edit", (req, res) => { // Edits url longURL from shortURL page
  const userIdCookie = req.cookies['user_id'];
  if (users[userIdCookie]['id'] === userIdCookie) {
    for (const shortURL in urlsForUser(userIdCookie)) {
      const url = req.params.shortURL;
      const newURL = req.body.name;
      urlDatabase[shortURL]['longURL'] = newURL;
      res.redirect(`/urls/${url}`);
    }
  }
});

app.post("/urls/:shortURL/delete", (req, res) => { // Delete shortURL: longURL entries
  const userIdCookie = req.cookies['user_id'];
  if (users[userIdCookie]['id'] === userIdCookie) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});



app.listen(PORT, () => { // listening port
  console.log(`Example app listening on port ${PORT}!`);
});