//load express, body-parser, hbs, cookie-parser, express-session, morgan and winston, filesystem, path, rotating-file-stream libraries

const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const mongoose = require('mongoose');
const passport              =  require("passport");
const LocalStrategy         =  require("passport-local");
const passportLocalMongoose =  require("passport-local-mongoose");
const User                  =  require("../models/user");

const logger = require('./web_logging').logger;

const foodItems = require('../models/FoodItem');
let FoodItem = foodItems.FoodItem;

const day = require('../models/Day');
let Day = day.Day;

//Get the app server port from the environment or default to 8000
const httpPort = process.env.PORT || 8000;

//Create express app to manage HTTP connection requests
var app = express();

//MongoDB Connection with error catching
mongoose
  .connect("mongodb+srv://ceid:GbU14GHGzIntbU7R@cluster0.53onh.mongodb.net/CalorieCounter?retryWrites=true&w=majority", { useNewUrlParser: true , useUnifiedTopology: true, useCreateIndex: true })
  .then(() => {
    console.log("DB has been connected!!! :)");
  })
  .catch((e) => {
    throw new Error('DB failed to connect');
    logger.error("DB failed to connect");
  })


app.use(cookieParser("djprc4498lsgs"));
app.use(session({
  secret: 'djprc4498lsgs',
  cookie: {maxAge: 300000},
  resave: false,
  saveUninitialized: false
}));

app.use(express.static("public"));
app.use(express.static(__dirname + "/../public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + "/../views/partials");
const version = "2.00.00";
hbs.registerHelper('pageTitle', () => "Calorie Counter App");
hbs.registerHelper('getVersion', () => version);

passport.serializeUser(User.serializeUser());       //session encoding
passport.deserializeUser(User.deserializeUser());   //session decoding
passport.use(new LocalStrategy(User.authenticate()));
app.use(passport.initialize());
app.use(passport.session());

//Below are functions for displaying retrieved data from the database

//Print_log allows you to put in an array of database objects and return a string that can be sent to hbs
function print_log(arr){
  if (arr.length < 1){
    logger.error('Attempting to print the log for a day with no food items');
  }
  var print = "";
  for (var i = 0; i < arr.length; i++){
    print += "<div><b><u>" + arr[i].name + " </u></b><br/> Calories: " + arr[i].calories +" </div>";
  }
  var printLog = new hbs.SafeString(print);
  return printLog;
}

//findTotal allows you to find the total calories in a day by adding the calories from the objects in a Day schema.
function findTotal(arr){
  if (arr.length < 1){
    logger.error('Attempting to calculate calories for a day with no food items');
  }
  var print = "";
  var totalCal = 0;
  for (var i = 0; i < arr.length; i++){
    totalCal += arr[i].calories
  }
  print += "<br/><r><u><b>Total Daily Caloric Intake: " + totalCal + " cals</b></u></r>";
  var printLog = new hbs.SafeString(print);
  return printLog;
}

//Display_day_list displays all the days that the user has created. It gives the user the option to view any of those created days.
function display_day_list(day_list){

  var print = "";
  for(var i = 0; i < day_list.length; i++){
    // print += '  <button><a href="/singleLog">'+ day_list[i] +'<a></button></br>';
    print += '<form action="/singleLog" method="get">';
    print += '<input type="submit"value="'+ day_list[i] +'"/>';
    print += '<input type="hidden" name="day" value="'+day_list[i]+'"> ';
    print += '</form>'
  }
  logger.info("A user is searching for a daily log");
  var returnPrint = new hbs.SafeString(print);
  return returnPrint
}


//ROUTE FUNCTION

//verifies that the user is logged in
function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    else{logger.error("session expired/invalid");}
    res.redirect("/login");
}


//ROUTES BEGIN
app.get("/", (req,res) =>{
    res.render("home");
    logger.info("A user arrived to the website");
})
app.get("/index",isLoggedIn ,(req,res) =>{
    res.render("index");
});


//authentication Routes
app.get("/login",(req,res)=>{
    res.render("login");
});

//Login uses passport to encrypt the password when storing it in the database. It uses .authenticate to authenticate user's credentials
app.post('/login', function(req, res, next) {

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      logger.warning("Unauthorized user attempted a login");
      return res.status(401).redirect('/invalid');
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      req.session.username = req.body.username;
      logger.info("Successful login by a user: " + req.session.username );
      return res.status(302).redirect('/index');
    });
  })(req, res, next);
});


app.get("/register",(req,res)=>{
    res.render("register");
});

//register allows a user to create a new account. It prevents a user from using a previously used username.
app.post("/register",(req,res)=>{

    User.register(new User({username: req.body.username,name:req.body.name}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            logger.alert("A user attempted to register with a previous username");
            res.render("already");
        }
    passport.authenticate("local")(req,res,function(){
        logger.info("A new user was registered.");
        res.status(302).redirect("/login");
    })
    })
});
//logout destroys session
app.get("/logout",(req,res)=>{
    logger.info("A user logged out");
    req.logout();
    req.session.destroy();
    res.status(302).redirect("/");
});
//a route for invalid password or username
app.get("/invalid",(req, res)=>{
  res.render("invalid");
});

//a route for a previously used username
app.get("/already",(req, res)=>{
  res.render("already");
});


//APP FUNCTIONALITY ROUTES

//Add item allows one to add an item and day object to the database.
app.get('/addItem',isLoggedIn, function(req, res){
  //Taking data from form
  var title = req.query.title;
  var calories = req.query.calories;
  var date = req.query.date;

  if (date.slice(0,4) != 2020 ){
    res.status(400).send("Invalid Year. Calories can only be logged for 2020."  + '<p><a href="/index">Return to Calorie Counter Homepage</a></p>');
    logger.warning("Improper date input by user");//exeptions logged
    return;
  }


  //CREATES NEW ITEM from form data
  var newItem = new FoodItem({name: title, calories, date, id: req.session.username});
  newItem.save(); //sends it to database
  logger.info("A new item was added to the MongoDB 'fooditem' collection");

  //SEES IF DAY WITH FORM query.date exists
  Day.exists({date:date}, function (err, doc) {
    if (err){
        logger.error(err);
        console.log(err)
    }else{
        console.log("Result :", doc) // false
        if (doc == false){
          //if day with that date doesn't exist, it creates a new one
          var thisDay = new Day({date, calories:0, id:req.session.username});
          logger.info("A new day was added to the MongoDB 'days' collection");
          logger.info("NEW DAY: " + date);
          logger.info("ITEM ADDED: " + newItem);
          thisDay.save();
        }
        else{
          //else, it updates the previously created day
          Day.updateOne({date : date} , {$addToSet: {log: newItem._id}}).then(data => {
            logger.info("A 'day' was updated in the MongoDB 'days' collection");
            logger.info("DATE UPDATED: " + date);
            logger.info("UPDATED WITH ITEM: " + newItem);
            });
        }
    }
  });

    res.render("item.hbs", {
      pageTitle: "Calorie Counter",
      title : title,
      calories : calories,
      date : date,
    });

});

//DAILY LOG renders a list of the user's created days. It renders it through buttons, so that the user can click on the day they want to see, and it will bring them there.
app.get('/dailyLog', isLoggedIn, function(req, res) {
  Day.find({id: req.session.username})
    .then(days => {
      logger.info(`A list of ${days.length} days was retrieved from the MongoDB 'days' collection.`);
      var day_list = new Array();
      for(var i = 0; i < days.length; i++){
        day_list.push(days[i].date);
      }
      var displayDays = display_day_list(day_list);

      res.render('dailylog.hbs',{
        pageTitle: "Calorie Counter App",
        header: "Welcome!",
        fooditems: displayDays
      });
    })
});

//SingleLog -- Result of pressing on the above button. Allows the user to view all fooditem data from a specific date.
app.get('/singleLog',isLoggedIn, function(req, res) {
  FoodItem.find({date: req.query.day, id: req.session.username})
    .then(fooditems => {
      logger.info(`A list of ${fooditems.length} fooditems was retrieved from the MongoDB 'fooditems' collection.`);
      var log_print = print_log(fooditems);
      var totalCal = findTotal(fooditems);


      res.render('singlelog.hbs', {
        pageTitle: "Calorie Counter App",
        header: "Welcome!",
        today:log_print,
        date: req.query.day,
        totalCal: totalCal
      });
    })
});


//ERROR CATCHING ROUTES
// 404
app.use(function(req, res, next) {
  return res.status(404).send("Invalid URL. <button><a href='/index'>Go to Homepage<a></button>");
});

// 500
app.use(function(err, req, res, next) {
  return res.status(500).send("500: Internal Server Error");
});


module.exports.app = app;
module.exports.function1 = print_log;
module.exports.function2 = findTotal;
module.exports.function3 = display_day_list;
