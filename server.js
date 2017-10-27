//dependencies
var express = require('express');
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

//Scraping tools//
var request = require('request'); // for web-scraping
var cheerio = require('cheerio'); // for web-scraping

//require comment and article models//
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

mongoose.Promise = Promise;


var databaseLink = "scraper";
var allLinks = ["scrapedData"];


console.log("\n***********************************\n" +
"Grabbing every thread name and link\n" +
"from Buzzfeed Latino's top stories:" +
"\n***********************************\n");


//initialize Express
var app = express();

// Use morgan and body parser 
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/mongoArticles");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});




// //hook up mongojs and db
// var db = mongojs(databaseLink, allLinks);
// db.on("error", function(error){
//   console.log("Database Error:", error);
// });


// Main route 
app.get("/", function(req, res) {
  res.send("Buzzfeed Latino Scraper");
});

// // Retrieve data from the db
// app.get("/all", function(req, res) {
//   // Find all results from the scrapedData collection in the db
//   db.scrapedData.find({}, function(error, found) {
//     // Throw any errors to the console
//     if (error) {
//       console.log(error);
//     }
//     // If there are no errors, send the data to the browser as json
//     else {
//       res.json(found);
//     }
//   });
// });


/// GET request to scrape the Buzzfeed website and place into mongo sb
app.get("/scrape", function(req, res){
  
      ///request for news articles in buzzfeed
    request("https://www.buzzfeed.com/tag/latino", function(error, response, html){
  
          ///load the html body from request into cheerio
          var $ = cheerio.load(html);
  
              //use cheerio to find each h2 class style" within an article tag and loop through results.
          $("article h2 class style").each(function(i, element){


                  //save scraped info into empty results object
                  var results = {};

                    // Add the text and href of every link, and save them as properties of the result object
                result.title = $(this).children("a").text();
                result.link = $(this).children("a").attr("href");

                // Using our Article model, create a new entry
                var entry = new Article(result);

                  // save that entry to the db
                entry.save(function(err, doc) {
                  // Log any errors
                  if (err) {
                    console.log(err);
                  }
                  // Or log the doc
                  else {
                    console.log(doc);
                  }
                });

          });
    });
            // Tell the browser that we finished scraping the text
            res.send("Scrape Complete");
});


  // Get the articles scraped from the mongoDB
  app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article.find({}, function(error, doc) {
      // Log any errors
      if (error) {
        console.log(error);
      }
      // Or send the doc to the browser as a json object
      else {
        res.json(doc);
      }
    });
  });


  // Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});

  
  //           ///save the text of the h1 tag as title
  //           var title = $(element).children("a").children("div.info-container").children("div.info").children("h1").text();
  //           ///save the h1 tag's parent a tag and save its href value as link
  //           var link = $(element).children("a").attr("href");
  
  //           results.push({
  //             title: title,
  //             link: link
  //           });
  
  //           /insert function which connects to mongo db
  //          if (title && link) {
  //            db.scrapedData.insert({
  //              title: title,
  //              link: link
  //            },
  //           function(err, inserted) {
  //             if (err) {
  //               console.log(err);
  //             }
  //             else{
  //               console.log(inserted);
  //             }
  //           });
  //         }
  //         }); 
  
  //         console.log(results);
          
  //   });
  
  //   res.send("Scrape Complete");
  
  // });

// // //use morgan and body parser with app
// app.use(logger('dev'));
// app.use(bodyParser.urlencoded({
//   extended: false
// }));

// //make public a static dir
// app.use(express.static("public"));

// //Database configuration with mongoose
// mongoose.connect('mongodb://<dbuser>:<dbpassword>@ds161194.mlab.com:61194/heroku_w04mkl92');

// //show any mongoose erros
// db.on('error', function(err) {
//   console.log('Mongoose Error: ', err);
// });

// //once logged in to the db through mongoose, log a response
// db.once('open', function() {
//   console.log('Mongoose connection successful.');
// });



// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});