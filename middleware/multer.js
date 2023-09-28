import multer from "multer";

const upload = multer({
  limits: {
    fileSize: 10000000    // 10mb size
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|PDF)$/)) {
      return cb(new Error('Please upload a valid pdf file'))
    }
    cb(undefined, true)
  }
});


export default upload;