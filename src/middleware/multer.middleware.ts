import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export const multerUpload = multer({ storage: storage, limits: {
  fieldSize: 25 * 1024 * 1024 // 25MB
} })

const singleAttachement = multerUpload.single('profileImageURL');
const multipleAttachements = multerUpload.array('attachments', 10);

export {singleAttachement, multipleAttachements};