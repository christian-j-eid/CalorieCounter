
const request = require("supertest");
const session = require('supertest-session');
const expect = require('expect');
var app = require('../web/caloriecounter').app;


//BASIC TESTING 
describe("Web Application Tests - basic routes", () => {
  // Verify the HTTP GET request to the server root
  // Expect (with Mocha) is the test framework using supertest to handle
  // the HTTP interactions
  it('should return home page', (done) => {
    request(app)
    .get('/')
    .expect(200)
    .expect((resp) => {
      expect(resp.text.indexOf("Welcome")).toBeGreaterThanOrEqual(0);
    })
    .end(done);
  });

  it('should return login page', (done) => {
    request(app)
    .get('/login')
    .expect(200)
    .expect((resp) => {
      expect(resp.text.indexOf("Login")).toBeGreaterThanOrEqual(0);
    })
    .end(done);
  });

  it('should return 404 with error message', (done) => {
    request(app)
    .get('/nosuchpage')
    .expect(404)
    .expect((resp) => {
      expect(resp.text.indexOf("Invalid URL")).toBeGreaterThanOrEqual(0);
    })
    .end(done);
  });
});
