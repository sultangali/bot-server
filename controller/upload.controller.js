import User from "../model/User.js"

export const uploadAvatar = async (req, res) => {

    const url = `/upload/users/${req.file.originalname}`

    await User.updateOne({
        _id: req.userId
    }, {
        avatar: url
    })
    res.json({
        url: url
    })
}

export const uploadBookImg = async (req, res) => {
    
    const url = `/upload/books/${req.file.originalname}`

    res.json({
        url: url
    })
}