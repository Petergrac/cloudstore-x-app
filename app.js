require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { PrismaClient } = require("./generated/prisma");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const path = require("path");
const flash = require("connect-flash");
const port = process.env.PORT;
const routes = require("./router/routes");
const passport = require("passport");
// Setup express
const app = express();
// Debug test
app.set('trust proxy',1);
// =======================PRISMA SETUP======================

const prisma = new PrismaClient();
// Setup session store
const sessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 60 * 60 * 1000, // ms
  dbRecordIdIsSessionId: true,
});

// =======================SESSION SETUP======================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: 'lax'
    },
  })
);
app.use(passport.session());
// =======================MIDDLEWARE SETUP======================
// Setup flash messages
app.use(flash());
// Setup static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));

// =======================VIEW ENGINE SETUP=================
// Setup view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ======================FLASH MESSAGES SETUP===============
// Setup global variables for flash messages
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// =======================ROUTES SETUP=======================
app.use(routes);

// =======================EXPRESS ERROR HANDLER==============
// Error handling middleware
app.use((err, req, res, next) => {
  console.error("--- ERROR CAUGHT BY EXPRESS ERROR HANDLER ---");
  console.error(err);
  const statusCode = err.statusCode || 500;
  let errorResponse = {
    message: err.message || "An unexpected error occurred.",
  };
  if (process.env.NODE_ENV === "production") {
    errorResponse.message = "An internal server error occurred.";
  } else {
    req.flash('error',`${err}`);
    res.redirect('/homepage');
  }
});
// Listening
app.listen(port, () => console.log(`Listening on http://localhost:${port}"`));
