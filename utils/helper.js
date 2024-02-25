const multer = require('multer');
const path = require('path');

export const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};

export const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'images');
    },
    filename: function (_req, file, cb) {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

export const fileFilter = (_req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};