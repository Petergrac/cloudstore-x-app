const { Router } = require("express");
const controller = require("../controllers/controller");
const passport = require("../authentication/localStrategy");
const authorized = require("../authentication/authorization");
const upload = require("../config/multer.config");

const routes = new Router();

// Index Route
routes.get("/", controller.indexPage);
//
// ---------------------- REGISTRATION ROUTES----------------
//
routes.get("/register", controller.registerPage);
routes.post("/register", controller.postRegister);

//
//-------------------------LOGIN ROUTES(AUTHENTICATIONS)-----
//
routes.get(
  "/login",
  (req, res, next) => {
    try {
      if (req.isAuthenticated()) {
        req.flash('success','Logged in Successfully!');
        return res.redirect("/homepage");
      }
      return next();
    } catch (error) {
      return next(error);
    }
  },
  controller.loginPage
);
routes.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
    successRedirect: "/homepage",
  }),
  controller.postLogin
);
// routes.post('/login', (req, res, next) => {
//     console.log("[ROUTE] POST /login hit.");
//     passport.authenticate('local', (err, user, info) => {
//         if (err) {
//             console.error("[AUTH HANDLER] Passport authentication error:", err);
//             return next(err); // Pass error to Express error handler
//         }
//         if (!user) {
//             console.log("[AUTH HANDLER] Passport authentication failed (no user):", info.message);
//             // Authentication failed, redirect or send error response
//             return res.redirect('/login?error=' + encodeURIComponent(info.message || 'Authentication failed'));
//         }
//         // User successfully authenticated by strategy
//         console.log("[AUTH HANDLER] User authenticated by strategy, calling req.logIn().");
//         req.logIn(user, (err) => {
//             if (err) {
//                 console.error("[AUTH HANDLER] req.logIn error:", err);
//                 return next(err); // Pass error to Express error handler
//             }
//             console.log("[AUTH HANDLER] req.logIn successful. Redirecting to /homepage.");
//             // Session is now established, redirect
//             return res.redirect('/homepage'); // Ensure this is the correct success redirect
//         });
//     })(req, res, next); // Don't forget to invoke the middleware!
// });
//
//---------------------------PROTECTED ROUTES-----------------/
//
routes.get("/homepage", authorized.isAuth, controller.homePage);
routes.post("/folders", authorized.isAuth, controller.createFolder);
routes
  .route("/folders/:folderId")
  .post(authorized.isAuth, controller.deleteFolder)
  .get(authorized.isAuth, controller.getFolder);
routes
  .route("/folders/:folderId/PUT")
  .post(authorized.isAuth, controller.updateFolder);
routes.post(
  "/folders/:folderId/uploads",
  authorized.isAuth,
  upload.single("uploadedFile"),
  controller.uploadFile
);
routes.post(
  "/upload",
  authorized.isAuth,
  upload.single("uploadedFile"),
  controller.uploadFile
);
routes.post("/files/:fileId", authorized.isAuth, controller.deleteFile);

//
// -----------------------------Logout user--------------------/
//
routes.post("/logout", authorized.logoutUser);
//
// ===============================PAGE NOT FOUND==================//
//
routes
  .route("*params")
  .get(authorized.isAuth, (req, res) => {
    res.redirect("/homepage");
  })
  .post(authorized.isAuth, (req, res) => {
    res.redirect("/homepage");
  });
module.exports = routes;
