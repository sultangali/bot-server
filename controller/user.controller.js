import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "config";

import User from '../model/User.js'
import Book from "../model/Book.js";

export const registration = async (req, res) => {
  try {

    const { email, fullname, phone, address, password } = req.body;

    const salt = await bcrypt.genSalt(6);

    const hash = await bcrypt.hash(password, salt);

    const document = new User({
      email,
      hashedPassword: hash,
      fullname,
      phone,
      address,
    });

    const isEmailExist = await User.findOne({
      email: email,
    })

    if (isEmailExist) {
      return res.status(400).json({
        message: "Қолданушы желіде тіркелген",
      });
    }

    const user = await document.save();

    const { hashedPassword, ...userData } = user._doc;

    const token = jwt.sign(
      {
        _id: user._id,
      },
      config.get("jwt_key"),
      { expiresIn: "1h" }
    );

    res.status(200).json({
      userData,
      token,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    let user = "";

    const validateEmail = (email) => {
      return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
    };

    if (validateEmail(login)) {
      user = await User.findOne({
        email: login,
      });
      if (!user) {
        return res.status(404).json({
          message: `Қолданушы '${login}' желіде жоқ`,
        });
      }
    } else {
      user = await User.findOne({
        phone: login,
      });
      if (!user) {
        return res.status(404).json({
          message: `Оқушы телефоны: '${login}' желіде жоқ`,
        });
      }
    }

    const isPassValid = await bcrypt.compare(
      password,
      user._doc.hashedPassword
    );

    if (!isPassValid) {
      return res.status(400).json({
        message: "Құпия сөз қате терілген",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      config.get("jwt_key"),
      {
        expiresIn: "1h",
      }
    );

    const { hashedPassword, ...userData } = user._doc;

    res.status(200).json({
      ...userData,
      token,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.userId;

    let user = "";

    if (Boolean(await User.findById(userId))) {
      user = await User.findById(userId)
        .populate("todo")
        .exec();

      const { hashedPassword, ...userData } = user._doc;

      res.status(200).json(userData);
    }

  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const update = async (req, res) => {
  try {
    const {
      fullname,
      phone,
      address
    } = req.body;

    const userId = req.userId;

    const user = await User.findById(userId);

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        fullname,
        phone,
        address
      }
    );

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
}

export const all = async (req, res) => {
  try {
    const users = await User.find().populate("todo").exec();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const setStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    const user = await User.findById(id);

    await User.updateOne(
      { _id: user._id },
      {
        status,
        role: 'client'
      }
    );

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
}

export const setRole = async (req, res) => {
  try {
    const { id, role } = req.body

    const user = await User.findById(id);

    await User.updateOne(
      { _id: user._id },
      {
        role
      }
    );

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
}

export const chat = async (req, res) => {
  try {

    const userMessage = req.body.message;

    const greetings = [`Сәлем`, `сәлем`, `привет`, `Сәлеметсіз бе`];
    const hello = greetings.some(greeting => userMessage.includes(greeting));
    
    if (hello) {
        res.json({ reply: `Сәлем, құрметті тұтынушы! Бізден қандай көмек керек?` });
        return;
    }
    
    const how = userMessage.match(`Қалайсыз?`);
    if (how) {
        res.json({ reply: `Жақсымын рахмет! Өзіңіз қалайсыз?` });
        return;
    }

    const howr = userMessage.match(`Жақсымын`);
    if (howr) {
        res.json({ reply: `Өте қуаныштымын. Сізге қандай көмегім қажет?` });
        return;
    }

    const matchBookInfo = userMessage.match(/Кітап туралы ақпарат керек: \[(.*?)\]/i);
    if (matchBookInfo) {
      const bookTitle = matchBookInfo[1];
      const book = await Book.findOne({ title: new RegExp(bookTitle, 'i') });
      if (book) {
        res.json({
          reply: `"${book.title}" кітабын ${book.author} авторы жзған. Толығырақ: ${book.description}. Бағасы: ${book.price}KZT. Қоймадағы саны: ${book.stock}. Категория: ${book.category}.`
        });
      } else {
        res.json({ reply: `"${bookTitle}" атауы бойынша кітап табылмады.` });
      }
      return;
    }

    const matchAuthorBooks = userMessage.match(/Авторда қандай кітаптар бар: \[(.*?)\]/i);
    if (matchAuthorBooks) {
      const authorName = matchAuthorBooks[1];
      const books = await Book.find({ author: new RegExp(authorName, 'i') });
      if (books.length > 0) {
        const bookTitles = books.map(book => book.title).join(', ');
        res.json({ reply: `${authorName} авторының кітабы: ${bookTitles}.` });
      } else {
        res.json({ reply: `"${authorName}" авторының кітаптары табылмады` });
      }
      return;
    }

    const matchCategoryBooks = userMessage.match(/Категория бойынша кітаптарды тауып бер: \[(.*?)\]/i);
    if (matchCategoryBooks) {
      const categoryName = matchCategoryBooks[1];
      const books = await Book.find({ category: new RegExp(categoryName, 'i') });
      if (books.length > 0) {
        const bookTitles = books.map(book => book.title).join(', ');
        res.json({ reply: `${categoryName} категориясы бойынша табылған кітаптар: ${bookTitles}.` });
      } else {
        res.json({ reply: `"${categoryName}" категориясында кітаптар табылмады.` });
      }
      return;
    }

    if (userMessage.includes('Маған кітаптар ұсыншы')) {
      const books = await Book.find().limit(8);
      const bookTitles = books.map(book => book.title).join(', ');
      res.json({ reply: `Міне бірнеше ұсынылатын керемет кітаптар тізімі: ${bookTitles}.` });
      return;
    }

    const matchBookAvailability = userMessage.match(/Қоймада осы кітап бар ма: \[(.*?)\]/i);
    if (matchBookAvailability) {
        const bookTitle = matchBookAvailability[1];
        const book = await Book.findOne({ title: new RegExp(bookTitle, 'i') });
        if (book) {
            res.json({ reply: `"${book.title}" кітабы қоймада бар. Қоймадағы саны: ${book.stock} дана` });
        } else {
            res.json({ reply: `"${bookTitle}" атауы бойынша кітап табылмады.` });
        }
        return;
    }

    const matchBookPrice = userMessage.match(/Осы кітап қанша тұрады: \[(.*?)\]/i);
    if (matchBookPrice) {
        const bookTitle = matchBookPrice[1];
        const book = await Book.findOne({ title: new RegExp(bookTitle, 'i') });
        if (book) {
            res.json({ reply: `"${book.title}" кітабының бағасы: ${book.price}KZT.` });
        } else {
            res.json({ reply: `"${bookTitle}" кітабы табылмады.` });
        }
        return;
    }

    res.json({ reply: "Кешіріңіз, мен сіздің өтінішіңізді түсінбедім. Кітап туралы тақырып, автор немесе санат бойынша сұрап көріңіз." });
  
  } catch (error) {
    res.status(500).json(error.message)
  }
}