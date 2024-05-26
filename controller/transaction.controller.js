import Transaction from "../model/Transaction.js"
import Book from '../model/Book.js'

export const create = async (req, res) => {
    try {
        const { id } = req.body; // ID книги
        const userId = req.userId; // ID пользователя

        const stockToAdd = 1;

        let message = ''

        const book = await Book.findById(id);

        if (!book) {
            return res.status(404).json({ message: 'Кітап табылмады' });
        }

        if (book.stock < stockToAdd) {
            return res.status(400).json({ message: 'Қоймадағы кітаптар саны жеткіліксіз' });
        }

        // Проверяем, существует ли уже транзакция для этой книги и пользователя, которая не завершена
        const existingTransaction = await Transaction.findOne({
            user: userId,
            book: id,
            status: { $in: ['Pending', 'Processing', 'Shipped'] }
        });

        if (existingTransaction) {
            existingTransaction.quantity += stockToAdd;
            existingTransaction.totalAmount += book.price * stockToAdd;
            await existingTransaction.save();
            message = `${book.title} кітабының ${existingTransaction.quantity} данасы себетке қосылды. Бағасы: ${existingTransaction.totalAmount} KZT`
        } else {
            // Создаем новую транзакцию
            const document = new Transaction({
                user: userId,
                book: id,
                quantity: stockToAdd,
                totalAmount: book.price * stockToAdd,
                status: 'Pending' // Устанавливаем начальный статус
            });

            await document.save();

            message = `${book.title} кітабының ${document.quantity} данасы себетке қосылды. Бағасы: ${document.totalAmount} KZT`
        }

        // Уменьшаем количество книг на складе
        book.stock -= stockToAdd;
        await book.save();

        return res.status(200).json({ message: message });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const getAll = async (req, res) => {
    try {
        const transactions = await Transaction.find().populate('user').populate('book').exec()
        res.status(200).json(transactions)
    } catch (error) {
        res.status(500).json(error.message)
    }
}

export const setStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const id = req.params.id;

        const transaction = await Transaction.findById(id).populate('book').exec();
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const book = await Book.findById(transaction.book._id);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        if (stock === 0) {
            await Transaction.findByIdAndDelete(id);
            await Book.updateOne({ _id: book._id }, { stock: book.stock + transaction.quantity });
        } else {
            const stockDifference = stock - transaction.quantity;
            
            await Transaction.updateOne({ _id: transaction._id }, { quantity: stock });
            await Book.updateOne({ _id: book._id }, { stock: book.stock - stockDifference });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const pay = async (req, res) => {
    try {
        const userId = req.userId;

        const transactions = await Transaction.find({ user: userId }).populate('user').exec();

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: "Транзакция табылмады" });
        }

        await Transaction.updateMany({ user: userId }, { status: 'Shipped' });

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
