const validate = require("../validation/validations");
const { validationResult } = require("express-validator");
const database = require("../database/queries");
const bcrypt = require("bcrypt");
const supabase = require("../config/supabaseClient");

// Index Page
function indexPage(req, res) {
  res.render("index");
}

// ============================REGISTERATION CONTROLLERS ==============================//
//
//
// Register Page
async function registerPage(req, res) {
  res.render("register");
}

// Adding the user
const postRegister = [
  validate,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach((err) => {
        formattedErrors[err.path] = err.msg;
      });
      return res.render("register", {
        errors: formattedErrors,
        name: req.body.name,
        email: req.body.email,
      });
    }
    // Hash the password
    const hash = await bcrypt.hash(req.body.password, 10);
    // add user to the database
    await database.addUser(req.body, hash);
    res.redirect("/login");
  },
];

// ============================ AUTHENTICATION CONTROLLERS ==============================//
//
//
async function loginPage(req, res) {
  res.render("login");
}
// Post login
async function postLogin(req, res) {
  res.redirect("/homepage");
}
// Homepage
async function homePage(req, res) {
  if (req.user) {
    res.render("homepage", {
      user: req.user,
    });
  } else {
    req.flash("error", "You must be logged in to view this page.");
    res.redirect("/login");
  }
}
//
// ============================== FOLDERS HANDLER CONTROLLERS ====================//
//
//  Create a folder
async function createFolder(req, res) {
  const { folderName, folderInherit: parentId } = req.body;
  const id = req.user.id;
  if (!parentId) {
    await database.folderCreate(folderName, id);
    req.flash("success", `Folder "${folderName}" created successfully!`);
    return res.redirect("/homepage");
  } else {
    await database.folderCreate(folderName, id, parentId);
    req.flash("success", `Folder "${folderName}" created successfully!`);
    return res.redirect(`/folders/${parentId}`);
  }
}
// Find Folder by id
async function getFolder(req, res, next) {
  try {
    const id = req.params.folderId;
    const owner = req.user.id;
    const folder = await database.getFolderById(id,owner);
    res.render("folders", { user: req.user, currentFolder: folder });
  } catch (error) {
    console.log("Error when retrieving folder by id");
    next(error);
  }
}

// Update a folder
async function updateFolder(req, res, next) {
  const { folderName } = req.body;
  const folderId = req.params.folderId;
  await database.updateFolderName(folderId, folderName);
  res.redirect(`/folders/${folderId}`);
}
// Delete a folder
async function deleteFolder(req, res, next) {
  try {
    const folderId = req.params.folderId;
    await database.deleteFolder(folderId);
    req.flash("success", "Folder deleted successfully");
    res.redirect("/homepage");
  } catch (error) {
    console.log("Failed to delete the folder");
    next(error);
  }
}
//
// ============================== FILE HANDLER CONTROLLERS ====================//
//
// Upload a file
const uploadFile = async (req, res, next) => {
  const { folderId } = req.params;
  const userId = req.user.id;
  if (!req.file) {
    req.flash("error", "No file selected for upload");
    return res.redirect(folderId ? `/folders/${folderId}` : "/homepage");
  }

  // uploaded file details
  const{ originalname: originalFilename, mimetype, size, buffer: fileBuffer} = req.file;
  // Creating a path
  const supabasePath = folderId
    ? `${userId}/${folderId}/${originalFilename}`
    : `${userId}/root_files/${originalFilename}`;

  try {
    // 1.Upload to supabase storage
    const { data, error: storageError } = await supabase.storage
      .from("file-storage-app")
      .upload(supabasePath, fileBuffer, {
        contentType: mimetype,
        upsert: false,
      });
    // Handling Errors
    if (storageError) {
      console.error("Supabase upload error: ", storageError);
      throw new Error(
        `Failed to upload file to storage: ${storageError.message}`
      );
    }
    // Get the public url of the uploaded file
    const publicUrl = supabase.storage
      .from("file-storage-app")
      .getPublicUrl(supabasePath).data.publicUrl;

    // 2.Save the metadata to postgreSQL
    const fileData = {
      filename: originalFilename,
      mimetype: mimetype,
      size: size,
      url: publicUrl,
      folderId: folderId,
      ownerId: userId,
    };
    await database.createFile(fileData);

    req.flash("success", `File ${originalFilename} uploaded successfully`);
    res.redirect(folderId ? `/folders/${folderId}`: '/homepage');
  } catch (error) {
    console.error(`Failed to upload the file. Upload error ${error.message}`);
    return next(error);
  }
};
const deleteFile = async (req, res, next) => {
  const { fileId } = req.params;
  const userId = req.user.id;

  try {
    await database.deleteFile(fileId, userId);
    req.flash("success", "File Deleted successfully");
    res.redirect("/homepage");
  } catch (error) {
    console.error("Controller Error Deleting the File: ", error);
    req.flash("error", error.message || "Failed to delete File");
    return next(error);
  }
};
module.exports = {
  indexPage,
  registerPage,
  postRegister,
  loginPage,
  postLogin,
  homePage,
  createFolder,
  deleteFolder,
  getFolder,
  updateFolder,
  uploadFile,
  deleteFile,
};
