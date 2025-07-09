const multer = require('multer');

// Setting storage to memory
const storage = multer.memoryStorage();

// Multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
});

module.exports = upload;