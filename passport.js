const db = require('./services/db');
const helper = require('./helper');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
  
passport.serializeUser(async function(user, done) 
{
  var userData = user;
  if(user.provider == "twitter")
  {
    var userD = user._json;
    userData = 
    { 
      'email' : userD.email,
      'displayName' : userD.name,
      'picture' : userD.profile_image_url
    }
  }
  else
  {
    if(user._json !== undefined)
    {
      var userD = user._json;
      var picturePath = "";
      if(userD.picture !== undefined)
      {
        if(userD.picture.data !== undefined)
        {
          picturePath = userD.picture.data.url;
        }
        else
        {
          picturePath = userD.picture;
        }
      }
      userData = 
      { 
        'email' : userD.email,
        'displayName' : userD.name,
        'picture' : picturePath
      }
    }
  }
  let email = userData.email;
  const rows1 = await db.query(
    `SELECT * FROM users WHERE email = "${email}"`
  );
  const data1 = helper.emptyOrRows(rows1);
  if(data1.length > 0)
  {
    done(null, data1[0]);
  }
  else
  {
    let name = userData.displayName;
    let email = userData.email;
    let picture = userData.picture;
    await db.query(
      `INSERT INTO users (name,email,picture) VALUES ("${name}","${email}","${picture}")`
    );
    const rows2 = await db.query(
      `SELECT * FROM users WHERE email = "${email}"`
    );
    const data2 = helper.emptyOrRows(rows2);
    done(null, data2[0]);
  }
});
passport.deserializeUser(async function(user, done) {
  done(null , user);
});
  
passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID, // Your Credentials here.
    clientSecret:process.env.GOOGLE_CLIENT_SECRET, // Your Credentials here.
    callbackURL:process.env.GOOGLE_CLIENT_CALLBACK,
    passReqToCallback:true
  },
  function(request, accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

//facebook strategy
passport.use(new facebookStrategy({

  // pull in our app id and secret from our auth.js file
  clientID : process.env.FACEBOOK_CLIENT_ID,
  clientSecret : process.env.FACEBOOK_SECRET_ID,
  callbackURL : process.env.FACEBOOK_CALLBACK,
  profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)','email']

},// facebook will send back the token and profile
function(token, refreshToken, profile, done) 
{
  return done(null,profile)
}));

//LinkedIn strategy
passport.use(new LinkedInStrategy({
  clientID : process.env.LINKEDIN_CLIENT_ID,
  clientSecret : process.env.LINKEDIN_SECRET_ID,
  callbackURL: process.env.LINKEDIN_CALLBACK,
  scope: ['profile', 'email', 'openid'],
  passReqToCallback: true,
}, function (req, accessToken, refreshToken, profile, done) 
{
  req.session.accessToken = accessToken;
  process.nextTick(function () {
    // To keep the example simple, the user's Linkedin profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the Linkedin account with a user record in your database,
    // and return that user instead.
    return done(null, profile);
  });
  // console.log(token, tokenSecret, profile, done,'call');
  // return done(null, profile);
}
));

//Twitter Strategy
passport.use(new TwitterStrategy({
  consumerKey : process.env.TWITTER_CLIENT_ID,
  consumerSecret : process.env.TWITTER_CLIENT_SECRET,
  callbackURL: process.env.TWITTER_CLIENT_CALLBACK,
  includeEmail: true,
}, function (token, tokenSecret, profile, done) {
  console.log('call');
  process.nextTick(function () {
    return done(null, profile);
  });
}));