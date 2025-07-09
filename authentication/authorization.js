function isAuth(req, res, next) {
  try {
    console.log("This is the authorization middleware", req.isAuthenticated());
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash(
      "error",
      "You are not authorized to access that URL.Please Login"
    );
    return res.redirect("/login");
  } catch (error) {
    return next(error);
  }
}
function logoutUser(req, res, next) {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return next(err);
    }
    res.redirect("/login");
  });
}
module.exports = { isAuth, logoutUser };
