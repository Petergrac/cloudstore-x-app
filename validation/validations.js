const { body } = require("express-validator");
const database = require('../database/queries');
const validate = [
  body("name").trim().isAlpha().withMessage("Name cannot be empty").bail(),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email")
    .bail()
    .custom(async (value) => {
      const exists = await database.checkEmail(value);
      if (!exists) {
        return true
      }
      throw new Error("Email already exists");
    })
    .bail(),
  body("password")
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("Enter a long password").bail().custom((value,{req})=>{
        if(value !== req.body.confirm_password){
            throw new Error("Passwords don't match")
        }else{
            return true
        }
    }).bail(),
];

module.exports = validate;