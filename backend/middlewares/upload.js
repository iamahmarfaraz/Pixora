const multer = require("multer");

// temporary in memory storage
const storage = multer.memoryStorage();

// accept all file no filterr
const upload = multer({storage});

module.exports = upload;