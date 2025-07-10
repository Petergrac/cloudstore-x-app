const database = require("../database/queries");
const crypto = require("crypto");

// ============= MIDDLEWARE FOR CREATING SHARED FOLDER ====================
//
// Shared folder creation
async function createSharedFolder(req, res, next) {
  const { folderId } = req.params;
  console.log(folderId);
  const userId = req.user.id;
  const { hours } = req.body;
  if (!userId) {
    req.flash("error", "Please login");
    return res.redirect("/login");
  }
  if (!folderId) {
    req.flash("error", "Please select a folder to share");
    return res.redirect("/homepage");
  }
  try {
    // Set expiry date
    let duration = null;
    if (!hours) {
      duration = 1; // default 1 hour
    } else {
      duration = parseInt(hours);
    }

    let expiresAt = null;
    expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    // Make sure this is the right owner
    const folderInfo = await database.getFolderById(folderId, userId);
    if (!folderInfo) {
      req.flash("error", "You are not authorized to access this folder");
      return res.redirect("/homepage");
    }
    // Create the key
    const accessKey = crypto
      .randomBytes(Math.ceil(16 / 2))
      .toString("hex")
      .slice(0, 16);
    // Save the sharable folder to the database
    const sharedDetails = {
      folderId,
      userId,
      accessKey,
      expiresAt,
    };
    const newShare = await database.createSharedFolder(sharedDetails);
    // Create sharable link
    const shareableURl = `${req.protocol}://${req.get("host")}/share/${
      newShare.accessKey
    }`;
    req.flash(
      "success",
      `Link created successfully! Share this URL: ${shareableURl}`
    );
    res.redirect(folderId ? `/folders/${folderId}` : "/homepage");
  } catch (error) {
    console.error("Error occured during the folder creation in the controller");
    next(error);
  }
}

// ====================MIDDLEWARE FOR READING THE SHARED FOLDER ======================
//
async function viewSharedFolder(req, res, next) {
  try {
    const { accessKey: key } = req.params;
    if (!key) {
        console.log('Lets see the key',key);
      req.flash("error", "Broken link or expired.");
      return res.redirect("/login");
    }
    // Retrieve the folder
    const sharedFolder = await database.getSharedFolder(key);
    // Check if the key is valid
    if (!sharedFolder) {
        console.log('This link is unknown');
      req.flash("error", "Invalid or expired Link");
      return res.redirect("/login");
    }
    // Check if it is expired
    if (sharedFolder && new Date() > sharedFolder.expiresAt) {
      await database.deleteSharedFolder(
        sharedFolder.id,
        sharedFolder.sharedById
      );
      req.flash("error", "Link expired");
      return res.redirect("/login");
    }
    // View the file
    console.log('You can now view the folder');
    res.render("shared_folder_view", {
      sharedFolder: sharedFolder,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Shared Folder Controller Error: ", error.message);
    next(error);
  }
}
//
// =========================MIDDLEWARE FOR DELETING SHARED FOLDER ====================
//
async function deleteSharedFolder(req, res, next) {
  try {
    const shareId = req.params;
    const userId = req.user.id;

    const deleteShared = await database.deleteSharedFolder(shareId, userId);
    if (deleteShared) {
      req.flash("success", "Share Link deleted successfully");
    } else {
      req.flash(
        "error",
        "Share link not found or you are not authorized to perform this action"
      );
    }
    return res.redirect(req.get("referrer") || "/homepage");
  } catch (error) {
    console.error(
      "error happened in the delete controller of shared folder; ",
      error.message
    );
    next(error);
  }
}
module.exports = {
  createSharedFolder,
  viewSharedFolder,
  deleteSharedFolder,
};
