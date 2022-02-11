/*
  Session Supertesting
*/

const request = require("supertest");

const session = require('supertest-session');

const expect = require('expect');

var app = require('../web/caloriecounter').app;

// Tests for access from unauthenticated users
describe("Web Application Tests - empty session", () => {
  var testSession = null;

  beforeEach(function () {
    testSession = session(app);
  });

  it('should redirect to the login page', (done) => {
    testSession.get('/index')
    .expect(302)
    .expect((resp) => {
      expect(resp.get("location")).toBe("/login");
    })
    .end(done);
  });



});

// Tests for access from authenticated users
describe("Web Application Tests - logged in user", () => {
  var testSession = null;

  // Setup the user's logged-in session
  beforeEach(function (done) {
    testSession = session(app);
    testSession.post('/login')
      .type('form')
      .send({ username: 'ceid', password: 'pass' })
      .expect(302)
      // .expect(200)
      .end(function (err) {
        if (err) return done(err);
        return done();
      });
  });

  //tests for secure routes
  it('should get the secure home page', (done) => {
    testSession.get('/index')
    .expect(200)
    .expect((resp) => {
      expect(resp.text.indexOf("Log Calories")).toBeGreaterThanOrEqual(0);
    })
    .end(done);
  });


  //test for logging out and destroying session
  it('should log out', (done) => {
    testSession.get('/logout')
    .expect(302)
    .expect((resp) => {
      expect(!resp.session);
    })
    .end(done);
  });


});
