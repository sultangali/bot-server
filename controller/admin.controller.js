
import Book from "../model/Book.js"

export const create = async (req, res) => {
    try {
        const { title, author, description, category, stock, price, imageUrl } = req.body;

        const existingBook = await Book.findOne({ title });
        if (existingBook) {
            return res.status(400).json({ message: 'Кітап жүйеде бар' });
        }

        const document = new Book({
            title,
            author,
            description,
            category,
            stock,
            price,
            imageUrl
        })
        await document.save()
        return res.status(200).json({ message: 'Тауар сәтті құрылды!' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const all = async (req, res) => {
    try {
        const books = await Book.find()
        res.status(200).json(books)
    } catch (error) {
        res.status(500).json(error.message)
    }
}