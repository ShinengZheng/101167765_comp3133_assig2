const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const getModel = require("./model");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const crypto = require("crypto");
var fs=require('fs');
const urlib = require("url");

app.use(cookieParser());

app.use("/resources",express.static(__dirname+"/resources"));
app.use("/images",express.static(__dirname+"/images"));
app.use(express.static('./images'));


app.use(bodyParser.urlencoded({ extended: true }));

app.set("views", __dirname+'/views');
app.set("view engine", "html");
app.engine("html", require("ejs").__express); 

const Hotel = getModel("Hotel");
const User = getModel("User"); 
const Book = getModel("Book");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({storage: storage});






function isLogin(req, res, next) {
  const { username } = req.cookies; 
  if (username) {
      next();
  } else {
      res.redirect("/login");
  }
}

app.get("/login", function (req, res) { 
  res.render("login");
})


app.get("/logout", function (req, res) { 
  res.clearCookie("username");
  res.clearCookie("userid");
  res.render("login");
})

app.post("/login", function (req, res) {
  let { username, password } = req.body;

  if(username == "admin" && password == "admin") {
    res.cookie("username", username);
    res.cookie("userid", "1");
    res.redirect("/");
    res.end();
    return;

  }
  password = crypto.createHmac("md5", "cyl").update(password).digest("hex"); 
  User.findOne({ username}, function (err, doc) {
      if (err) { 
      }
      if (doc) { 
          if (doc.password === password) { 
              res.cookie("username", username);
              res.cookie("userid", doc._id.toString());
              res.redirect("/");
              res.end();
          } else {
              
              res.render("error");
          }
      } else {
          res.render("error"); 
      }
  })
  
})

app.get("/register", function (req, res) {
  res.render("register");
})

// register
app.post("/register", function (req, res) {
  let { username, password, repassword, email} = req.body;
  console.log(username);
  console.log(password);
  console.log(repassword);
  console.log(email);

  if(username == "admin") {

    res.render("register_error");
    return;
  }
  password = crypto.createHmac("md5", "cyl").update(password).digest("hex");

  User.findOne({ username}, function (err, doc) {
      if (err) { 
      }
      if (doc) { 

          res.render("register_error");

      } else {
          User.create({ username, password, email }, function (err, doc) {
              
              if (err) {
              }
              if (doc) {
                  res.cookie("username", username);
                  res.cookie("userid", doc._id.toString());
                  res.redirect("/");
                  res.end();
              }
          })
      }
  })
})


app.post('/hotel_add', upload.single('pic'), function(req, res, next) {
  console.log(req.body);

  const { username, userid } = req.cookies; 
  let { hotel_name, street,city,postal_code,price,email } = req.body;
  console.log(hotel_name);
  console.log(req.file);
  // have image
  if(req.file) {
    console.log("image");
    var image = 'images/' + path.basename(req.file.path);
    var hotel={
      user_id: userid,
      hotel_name:hotel_name,
      street:street,
      city:city,
      postal_code:postal_code,
      price: price,
      email: email,
      image:image,
    }; 
    Hotel.create(hotel,function (error, doc) {
      console.log(error);
      if(error){
        res.send({
          err: null,
          msg: 'add hotel fail'
        });
      } else {
        res.send({
          err: null,
          msg: 'add hotel success'
        });
      }

    });

  
  // no image
  } else {
    console.log("no image")
    var hotel={
      user_id: userid,
      hotel_name:hotel_name,
      street:street,
      city:city,
      postal_code:postal_code,
      price: price,
      email: email,
      image:"noimage",
    }; 
    Hotel.create(hotel,function (error, doc) {
      console.log(error);
      if(error){
        res.send({
          err: null,
          msg: 'add hotel fail'
        });
      } else {
        res.send({
          err: null,
          msg: 'add hotel success'
        });
      }

    });


  }
});

// books 
app.get("/hotels", isLogin, function (req, res) {
  const { username,userid } = req.cookies;


  var myObj = urlib.parse(req.url,true);
  var hotel_name = myObj.query.hotel_name;
  var city = myObj.query.city;  

  console.log(hotel_name)
  console.log(city)
  if(hotel_name && city) {
  
    Hotel.find({hotel_name:hotel_name, city:city}, function (err, doc) {
      console.log(doc);
      Book.find({user_id:userid}, function (err, bookdoc) {
      
          res.render("hotels", { username, hotelList:doc, bookHotelList:bookdoc});
      });
    });

  } else if(hotel_name) {

  
    Hotel.find({hotel_name:hotel_name}, function (err, doc) {
      console.log(doc);
      Book.find({user_id:userid}, function (err, bookdoc) {
      
          res.render("hotels", { username, hotelList:doc, bookHotelList:bookdoc});
      });
    });

  } else if(city) {

  
    Hotel.find({ city:city}, function (err, doc) {
      console.log(doc);
      Book.find({user_id:userid}, function (err, bookdoc) {
      
          res.render("hotels", { username, hotelList:doc, bookHotelList:bookdoc});
      });
    });    

  }
  
  else{
 
    Hotel.find({}, function (err, doc) {
      console.log(doc);
      Book.find({user_id:userid}, function (err, bookdoc) {
      
          res.render("hotels", { username, hotelList:doc, bookHotelList:bookdoc});
      });
    });
  }
})



app.get("/", isLogin, function (req, res) {
  res.redirect("hotels")
})


app.post("/hotel_delete",function (req,res) {

  var _id=req.body._id;

  Hotel.findOne({_id},function (error, dbBook) {
      if(error) {
        res.send({
          err: null,
          msg: 'delete hotel fail'
        });

      } else {

      Hotel.remove({_id},function (error, doc) {
          if(error) {
            res.send({
              err: null,
              msg: 'delete hotel fail'
            });
          } else {
            if(dbBook.image != "noimage"){
                fs.unlinkSync(dbBook.image);
            }
            res.send({
              err: null,
              msg: 'delete hotel success'
            });
        }          
      });
    }
  });

});

app.get("/hotel_update/:_id",function (req,res) {
  const { username, userid } = req.cookies;
  var _id=req.params._id;

  Hotel.findOne({_id},function (error, hotel) {
      res.render("hotel_update",{
          hotel:hotel, username
      });
  });
});


app.get("/hotel_book/:_id",function (req,res) {
  const { username, userid } = req.cookies;
  var _id=req.params._id;

  Hotel.findOne({_id},function (error, hotel) {
      res.render("hotel_book",{
          hotel:hotel, username
      });
  });
});





app.post('/hotel_update', upload.single('pic'), function(req, res, next) {
  console.log(req.body);
  const { username,userid } = req.cookies; 
  let { _id, hotel_name, street,city,postal_code,price,email } = req.body;
  // have image
  if(req.file) {
    console.log("image");
    var image = 'images/' + path.basename(req.file.path);
    var hotel={
      hotel_name:hotel_name,
      street:street,
      city:city,
      postal_code:postal_code,
      price: price,
      email: email,
      image:image,
    }; 
    
    Hotel.update({_id}, {$set: hotel}, function (error, doc) {
      console.log(error);
      if(error){
        res.send({
          err: null,
          msg: 'update hotel fail'
        });
      } else {
        res.send({
          err: null,
          msg: 'update hotel success'
        });
      }

    });

  
  // no image
  } else {
    console.log("no image")
    var hotel={
      hotel_name:hotel_name,
      street:street,
      city:city,
      postal_code:postal_code,
      price: price,
      email: email,
    }; 

    console.log(hotel);
    Hotel.update({_id}, {$set: hotel}, function (error, doc) {
      console.log(error);
      if(error){
        res.send({
          err: null,
          msg: 'update hotel fail'
        });
      } else {
        res.send({
          err: null,
          msg: 'update hotel success'
        });
      }

    });


  }

});



app.post("/hotel_book",upload.single('pic'), function(req, res, next) {


  const { username,userid } = req.cookies; 
  console.log(req.body);
  let { hotel_id, booking_start, booking_end } = req.body;
  
  console.log(req.body);

  Book.find({hotel_id, user_id:userid},function (error, bookhotel) {
    if(error) {
      res.send({
        err: 'error',
        msg: 'book hotel fail'
      });

    } else {

      if(bookhotel.length >= 1) {

        res.send({
          err: 'error',
          msg: 'alreay book'
        });
        return;

      }

      console.log(hotel_id);
    
      Hotel.findOne({_id:hotel_id},function (error, dbHotel) {
          if(error) {
            res.send({
              err: null,
              msg: 'book hotel fail'
            });

          } else {     

          
          console.log("-----");
          console.log(dbHotel);
          console.log("-----");

          var book={
            user_id: userid,
            hotel_id: hotel_id,
            booking_start:booking_start,
            booking_end:booking_end,
          };       

          console.log(book);
          Book.create(book,function (error, doc) {

              console.log(error);
              if(error) {
                res.send({
                  err: null,
                  msg: 'book hotel fail'
                });
              } else {
                res.send({
                  err: null,
                  msg: 'book hotel success'
                });
            }          
          });
        }
      });
    }

  });

});

app.listen(3000, function () {
  console.log("app is listening");
});
