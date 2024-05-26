import express from 'express'
import * as controller from '../controller/index.js'
import * as validation from '../service/validation.js'
import validationHandler from '../service/validationHandler.js'
import checkAuth from '../middleware/checkAuth.js'

const userRouter =  express.Router()

userRouter.post('/auth/registration', validation.registration, validationHandler, controller.user.registration)
userRouter.post('/auth/login', validation.login, validationHandler, controller.user.login)
userRouter.post('/chat', controller.user.chat)
userRouter.patch('/me/update', checkAuth, validation.updateProfile, validationHandler, controller.user.update )
userRouter.patch('/status', checkAuth, controller.user.setStatus)
userRouter.patch('/role', checkAuth, controller.user.setRole)
userRouter.get('/me', checkAuth, controller.user.me)
userRouter.get('/all', checkAuth, controller.user.all)

export default userRouter