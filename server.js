//dependencies
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var logger = require("morgan");

//Scraping tools//
var request = require('request'); // for web-scraping
var cheerio = require('cheerio'); // for web-scraping

//require comment and article models//
// var Comment = require('./models/Comment.js');
// var Article = require('./models/Article.js');



console.log("\n***********************************\n" +
"Grabbing every thread name and link\n" +
"from Remezcla's top stories:" +
"\n***********************************\n");


//initialize Express
var app = express();

// //use morgan and body parser with app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

//make public a static dir
app.use(express.static("public"));

//Database configuration with mongoose
mongoose.connect('mongodb://<dbuser>:<dbpassword>@ds161194.mlab.com:61194/heroku_w04mkl92');
var db = mongoose.connection;

//show any mongoose erros
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

//once logged in to the db through mongoose, log a response
db.once('open', function() {
  console.log('Mongoose connection successful.');
});



///Routes

/// GET request to scrape the Remezcla website
app.get("/scrape", function(req, res){

  request("http://remezcla.com/culture/", function(error, response, html){

  
        var $ = cheerio.load(html);

        //save scraped info into empty results array
        var results = [];

        //use cheerio to find each div.archive-article post-grid" tag and loop through results.
        $("div.archive-article post-grid").each(function(i, element){

          ///save the text of the h1 tag as title
          var title = $(element).children("a").children("div.info-container").children("div.info").children("h1").text();
          ///save the h1 tag's parent a tag and save its href value as link
          var link = $(element).children("a").attr("href");

          results.push({
            title: title,
            link: link
          });

          /insert function which connects to mongo db
         if (title && link) {
           db.scrapedData.insert({
             title: title,
             link: link
           },
          function(err, inserted) {
            if (err) {
              console.log(err);
            }
            else{
              console.log(inserted);
            }
          });
        }
        }); 

        console.log(results);
        
  });

  res.send("Scrape Complete");

});


// Main route (simple Message)
app.get("/", function(req, res) {
  res.send("Remezcla Scraper");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});




// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});