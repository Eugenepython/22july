const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('./config/keys');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const cookieSession = require('cookie-session');

mongoose.connect(keys.mongoURI); // this means that we are connecting our mongoURI from the website 
// to the mongoose.connect function. so that we can connect to the database online. Mongoose
// is a library that helps us connect to the mongoDB database.

console.log('keys:', keys);
const app = express(); //we are creating an instance of the express class
// and assigning it to the variable app.

app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
);// we are taking the express class instance and applying the use method to it. This takes
// the cookieSession function and applies it to the express instance. This is a middleware
// middleware function that modifies the request object before it reaches the route handlers and
// applies maxAge and keys to it. maxAge is the time that the cookie will last before it expires.
// keys is the key that will be used to encrypt the cookie. This is a security measure.
// i just made up my own cookieKey.


app.use(passport.initialize());// we are taking the express class instance
// and appliying the use method to it. This takes the passport.initialize function outcome as an argment 
// which sets up the passport library after login. 


app.use(passport.session()); // we are taking the express class instance
// and appliying the use method to it.  This takes the passport.initialize function outcome as an argment 
// which sets up the passport library on each itneraction following the login.



const userSchema = new Schema({
  googleId: String
});// userSchema is new instance of the Schema class that we imported with mongoose. 
// we have created an object with a property of googleId and a value of String. This is the
// schema that we will use to create a new user.

const User = mongoose.model('users', userSchema); // we are creating a new model instance
// of the userSchema. This is the model that we will use to create a new user. The first argument
// is the name of the collection that we will be creating. The second argument is the schema that
// we will be using to create the collection. we are creating the model shoe name is users. 


passport.serializeUser((user, done) => {
  console.log('serializeUser:', user);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log('deserializeUser:', id);
  User.findById(id).then(user => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientID,
      clientSecret: keys.googleClientSecret,
      callbackURL: '/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      } else {
      const user = await new User({ googleId: profile.id }).save();
      done(null, user)
    }
  }
  )
);





app.get('/', (req, res) => {
  res.send('Hello, world! this is 16th July app');
  
});

  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );

  app.get('/auth/google/callback', passport.authenticate('google'));

  app.get('/api/logout', (req, res) => {
    req.logout();
    res.send(req.user); 
  });

  app.get('/api/current_user', passport.authenticate('google'), (req, res) => {
    console.log('req.user:', req.user);
    res.send(req.user);
  });
  

const PORT = process.env.PORT || 5000;
app.listen(PORT);
