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
