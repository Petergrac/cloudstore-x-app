const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const database = require("../database/queries");
const bcrypt = require("bcrypt");

// form Fields
const formFields = {
  usernameField: "email",
  passwordField: "password",
  passReqToCallback: true,
};

// Verify Callback
async function verifyForm(req, email, password, done) {
  try {
    // Check for that user
    const user = await database.getUserByEmail(email);
    console.log('Thi is the verify callback=>',user);
    if (!user) {
      return done(
        null,
        false,
        req.flash("error", "Incorrect Email or Password")
      );
    }
    // Verify Password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return done(null, false, req.flash("error", "Incorrect Password"));
    }
    //   Pass control to the next middlware
    return done(null, user);
  } catch (error) {
    console.log("Error in the verify middleware", error);
    return done(error);
  }
}

const strategy = new LocalStrategy(formFields, verifyForm);

passport.use(strategy);

// Serialize user
passport.serializeUser((user, done) => {
  try {
    if (user) {
        console.log('This is serialize middleware',user.id);
      return done(null, user.id);
    }
    return done(null, false);
  } catch (err) {
    console.log(
      `This error happened in the serialize middleware ${err.message}`
    );
    return done(err);
  }
});
// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    console.log('This is deserialize middleware: ',id);
    const user = await database.getUserById(id);
    console.log('This is deserialize middleware',user);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    console.log(`Error happened in the deserialize middleware`);
    return done(error);
  }
});

module.exports = passport;
