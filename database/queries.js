const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

//
//  ========================= CREATE  ===========================//
//
//  Add user          =======USER======
async function addUser(details, hash) {
  await prisma.user.create({
    data: {
      name: details.name,
      email: details.email,
      password: hash,
    },
  });
}
//
// Create folder       =======FOLDER======
async function folderCreate(folderName, id, parId = null) {
  await prisma.folder.create({
    data: {
      name: folderName,
      ownerId: id,
      parentId: parId,
    },
  });
}

// Create a file      =======FILE======
async function createFile(fileData) {
  const newFile = await prisma.file.create({
    data: {
      filename: fileData.filename,
      mimetype: fileData.mimetype,
      size: fileData.size,
      url: fileData.url,
      folderId: fileData.folderId,
      ownerId: fileData.ownerId,
    },
  });
  return newFile;
}

// Create shared folder ======= SHARED Folder =======
//
async function createSharedFolder(folderDetail) {
  try {
    const sharedFolder = await prisma.sharedFolder.create({
      data: {
        folderId: folderDetail.folderId,
        sharedById: folderDetail.userId,
        accessKey: folderDetail.accessKey,
        expiresAt: folderDetail.expiresAt,
      },
    });
    return sharedFolder;
  } catch (error) {
    console.error("Cannot create the shared link");
    throw error;
  }
}
//
//  ========================= READ  ===========================//
//
// Check email       =======USER======
async function checkEmail(userEmail) {
  const exists = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
    select: {
      email: true,
    },
  });
  return exists;
}
// Get user by email  =======USER======
async function getUserByEmail(userEmail) {
  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
    include: {
      files: true,
      folders: true,
    },
  });
  return user;
}
// Get user By Id     =======USER======
async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      files: true,
      folders: true,
    },
  });
  return user;
}
// Get folder by id    =======FOLDER======
async function getFolderById(folderId, owner) {
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      ownerId: owner,
    },
    include: {
      children: {
        orderBy: {
          name: "asc",
        },
      },
      files: {
        orderBy: {
          filename: "asc",
        },
      },
      parent: true,
    },
  });
  return folder;
}
// Get shared folder by access key  =======SHARED FOLDER ======
async function getSharedFolder(key) {
  const sharedFolder = await prisma.sharedFolder.findUnique({
    where: {
      accessKey: key,
    },
    include: {
      folder: {
        include: {
          children: true,
          files: true,
          owner: {
            select: { name: true },
          },
        },
      },
      sharedBy: {
        select: { name: true },
      },
    },
  });
  return sharedFolder;
}
//
// =====================================UPDATE========================//
//                                   =======FOLDER======
async function updateFolderName(folderId, newName) {
  await prisma.folder.update({
    where: {
      id: folderId,
    },
    data: {
      name: newName,
    },
  });
}
//
// =====================================DELETE========================//
//
// Delete folder           =======FOLDER======
async function deleteFolder(folderId) {
  await prisma.folder.delete({
    where: {
      id: folderId,
    },
  });
}
// Delete file             =======FILE=======
async function deleteFile(fileId, ownerId) {
  try {
    // 1.Obtain the file you want to delete
    const fileToDelete = await prisma.file.findUnique({
      where: {
        id: fileId,
        ownerId: ownerId,
      },
      select: {
        filename: true,
        folderId: true,
        url: true,
      },
    });
    if (!fileToDelete) {
      throw new Error("File not found or unauthorized to delete.");
    }

    // 2.Extract the Supabase url path
    const urlParts = fileToDelete.url.split("/public/file-storage-app/");
    if (urlParts.length < 2) {
      throw new Error("Could not parse Supabase URL for deletion");
    }
    const SupabaseFilePath = urlParts[1];
    // 3. Delete the file from the SUpabase
    const supabase = require("../config/supabaseClient");
    const { error: storageError } = await supabase.storage
      .from("file-storage-app")
      .remove([SupabaseFilePath]);
    if (storageError) {
      console.error("Supabase Storage Deletion Error: ", storageError);
      throw new Error(
        "Failed to delete file form the storage",
        storageError.message
      );
    }
    console.log(`File ${SupabaseFilePath} deleted Successfully`);
    // 4.Delete the file metadata from postgreSQL database
    await prisma.file.delete({
      where: {
        id: fileId,
        ownerId: ownerId,
      },
    });
  } catch (error) {
    console.log("Error Deleting the file", error);
    throw error;
  }
}
//
//                ============== SHARED FOLDER = =============
//
async function deleteSharedFolder(id, ownerId) {
  try {
    const deleteShared = await prisma.sharedFolder.delete({
      where: {
        id: id,
        sharedById: ownerId,
      },
    });
    return deleteShared.count > 0;
  } catch (error) {
    console.error(`Error deleting the folder: ${error.message}`);
    throw error;
  }
}

module.exports = {
  checkEmail,
  addUser,
  getUserByEmail,
  getUserById,
  folderCreate,
  getFolderById,
  deleteFolder,
  updateFolderName,
  createFile,
  deleteFile,
  createSharedFolder,
  getSharedFolder,
  deleteSharedFolder,
};
