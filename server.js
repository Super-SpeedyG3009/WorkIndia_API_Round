const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/users');
const { authenticateJWT } = require('./middleware');
const Article = require('./models/articles');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

const dbUrl = process.env.DB_URL;
const jwtSecret = process.env.JWT_SECRET; 

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(dbUrl);
  console.log("Mongo connected");
}

app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPsw = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPsw });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error signing up:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/api/login", async (req, res) => { 
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/api/shorts/create", authenticateJWT, async (req, res) => { 
  try {
    const {category, title, author, content, link, image, net_votes} = req.body;
    const newArticle = new Article({category, title, author, content, link, image, net_votes});

    await newArticle.save();
    if(newArticle){
        res.status(200).json({ message: 'Article created successfully' });
    }else{
        res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    console.error('Error creating short:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/shorts/feed", authenticateJWT, async (req, res) => {
    try {
      const shorts = await Article.find().populate('author', 'username'); 
      res.status(200).json({ shorts });
    } catch (err) {
      console.error('Error getting shorts:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/shorts/filter', authenticateJWT, async (req, res) => {
    try {
      const { authorName, title } = req.query; 
  
      let userIds = [];
      if (authorName) {
        const users = await User.find({ username: { $regex: authorName, $options: 'i' } });
        userIds = users.map(user => user._id); 
      }
  
      const query = {};
      if (userIds.length > 0) {
        query.author = { $in: userIds }; 
      }
      if (title) {
        query.title = { $regex: title, $options: 'i' }; 
      }
  
      const articles = await Article.find(query).populate('author', 'username');
  
      if (articles.length === 0) {
        return res.status(404).json({ message: 'No articles found matching the criteria' });
      }
  
      res.status(200).json(articles);
    } catch (err) {
      console.error('Error fetching articles:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  
app.listen(5000, () => {
  console.log("Serving on port 5000");
});
