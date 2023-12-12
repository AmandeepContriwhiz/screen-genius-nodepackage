const express = require("express");
const path = require("path");
const cors = require('cors');
const multer  = require('multer');
const dotenv = require('dotenv');
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./local-storage');

dotenv.config();
//const upload = multer();
const app = express();
const passport = require('passport');
//const cookieSession = require('cookie-session');
require('./passport');
const port = 3000;
const userRoutes = require("./routes/userRoutes");
const screenshotRoutes = require("./routes/screenshotRoutes");
const videoRoutes = require("./routes/videoRoutes");
var session = require('express-session');
const helper = require('./helper');
app.use(express.json());
app.set('trust proxy', 1); // trust first proxy
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
  ],
};

app.use(cors(corsOpts));
app.use(session({  
  name: `screen-genius`,
  secret: 'quixy-screen-genius',  
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // This will only work if you have https enabled!
    maxAge: 3600000 // 1 hour
  } 
}));

// app.use(cookieSession({
//   name: 'google-auth-session',
//   keys: ['key1', 'key2']
// }));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  if ('OPTIONS' == req.method) {
       res.send(200);
   } else {
       next();
   }
});
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static(path.join(__dirname, "public")));

//app.use(upload.array());
app.get("/", (req, res, next) => {
  res.render("home", { title: "Home", session: req.session.passport !== undefined ? req.session.passport.user.email : null });
});
app.get("/thank-you", (req, res, next) => {
  res.render("thankYou", { title: "Thank you" });
});
app.get("/uninstall", (req, res, next) => {
  res.render("unInstall", { title: "Uninstall" });
});
app.get("/dashboard", helper.sessionCheckerWeb, (req, res, next) => {
  res.render("dashboard", { title: "Dashboard" });
});
app.get("/video-upload", helper.sessionCheckerWeb, (req, res, next) => 
{
  res.render("uploadVideo", { title: "Video Upload" });
});
app.get("/starred", helper.sessionCheckerWeb, (req, res, next) => {
  res.render("starred", { title: "Starred Items" });
});
app.get("/trashed", helper.sessionCheckerWeb, (req, res, next) => {
  res.render("trashed", { title: "Trashed Items" });
});
app.get("/edit-video/:id", helper.sessionCheckerWeb, (req, res, next) => {
  res.render("editVideo", { title: "Edit Video" });
});
app.get("/login", helper.sessionCheckerWebLogin, (req, res) => {
  res.render("login", { title: "Login" });
});
app.get('/auth' , passport.authenticate('google', 
  { 
    scope: [ 'email', 'profile' ]
  }
));

app.get( '/auth/callback',
    passport.authenticate( 'google', {
      successRedirect: '/auth/callback/success',
      failureRedirect: '/auth/callback/failure'
}));

app.get('/auth/callback/success' , (req , res) => {
  if(req.user)
  {
    var quixDashReturnTo = localStorage.getItem('quixDashReturnTo') || "/dashboard";
    localStorage.removeItem('quixDashReturnTo');
    localStorage.clear();
    res.redirect(quixDashReturnTo);
  }
  else
  {
      res.redirect('/auth/callback/failure');
  }
});
app.get('/auth/callback/failure' , (req , res) => {
  res.send("Error");
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
app.get('/auth/linkedin', passport.authenticate('linkedin', { scope : ["openid", "profile", "email"] }));
app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		  successRedirect: '/auth/callback/success',
      failureRedirect: '/auth/callback/failure'
    }
));
app.get('/auth/linkedin/callback',
    passport.authenticate('linkedin', {
      successRedirect: '/auth/callback/success',
      failureRedirect: '/auth/callback/failure'
    }
));
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect: '/auth/callback/success',
      failureRedirect: '/auth/callback/failure'
    }
));

app.use("/user", userRoutes);
app.use("/screenshots", screenshotRoutes);
app.use("/videos", videoRoutes);
/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});