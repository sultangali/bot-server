import express from 'express'
import * as controller from '../controller/index.js'
import checkAuth from '../middleware/checkAuth.js'

const transactionRouter = express.Router()

transactionRouter.post('/', checkAuth,   controller.transaction.create)
transactionRouter.patch('/pay', checkAuth, controller.transaction.pay)
transactionRouter.get('/all', checkAuth, controller.transaction.getAll)
transactionRouter.patch('/:id', checkAuth, controller.transaction.setStock)

export default transactionRouter