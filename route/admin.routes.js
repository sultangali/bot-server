import express from 'express'
import * as controller from '../controller/index.js'
import checkAuth from '../middleware/checkAuth.js'

const adminRouter =  express.Router()

adminRouter.post('/book', checkAuth, controller.admin.create)
adminRouter.get('/book/all', controller.admin.all)


export default adminRouter