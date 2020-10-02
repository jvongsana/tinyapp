const bcrypt = require('bcrypt');

const generateRandomString = () => Math.random().toString(16).slice(2, 8);

const createNewAccount = (id, email, password, database) => { // Creates new User object in Users
  database[id] = {
    id: id,
    email: email,
    password: password
  };
};

const emailExist = (email, database) => { // Checks if email belongs to an existing user
  for (const user in database) {
    if (database[user].email === email) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (id, database) => { // Returns object of all URLs made by specificed user
  let filteredURLs = {};
  for (const shortURL in database) {
    const urlObj = database[shortURL];

    if (urlObj.userID === id) {
      filteredURLs[shortURL] = urlObj;
    }
  }
  return filteredURLs;
};

const isLoginSuccessul = (email, password, database) => {
  for (const user in database) {
    const existingUser = database[user];
    const existingPassword = existingUser.password;
    if (existingUser.email === email && bcrypt.compareSync(password, existingPassword)) {
      return user;
    }
  }
  return;
};

module.exports = { generateRandomString, createNewAccount, emailExist, urlsForUser, isLoginSuccessul };