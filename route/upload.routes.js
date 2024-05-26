import express from 'express'
import multer from 'multer'

import * as controller from '../controller/upload.controller.js'
import checkAuth from '../middleware/checkAuth.js'
import storageService from '../service/diskStorage.js'

const uploadRouter = express.Router()

const uploadStudentAvatar = multer({
    storage: storageService('users')
})

const uploadBookImage = multer({
    storage: storageService('books')
})

uploadRouter.post('/avatar', checkAuth, uploadStudentAvatar.single('image'), controller.uploadAvatar)
uploadRouter.post('/book',  checkAuth, uploadBookImage.single('image'), controller.uploadBookImg)

export default uploadRouter