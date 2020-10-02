const { assert } = require('chai');

const { isLoginSuccessul } = require('../helpers.js');

const testUsers = {
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


describe('isLoginSuccessul', function() {
  it('should return a user with valid email', function() {
    const user = isLoginSuccessul("user@example.com", "purple-monkey-dinosaur", testUsers);
    const expectedOutput = "userRandomID";

    assert.equal(user, expectedOutput);
  });
  it('should return undefined', function() {
    const user = isLoginSuccessul("user@example.com", "dishwasher-funk", testUsers);
    const expectedOutput = undefined;

    assert.equal(user, expectedOutput);
  });
});