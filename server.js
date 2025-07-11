
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let bookmarks = [];

app.get('/bookmarks', (req, res) => {
  res.json(bookmarks);
});

app.post('/bookmarks', (req, res) => {
  const newBookmark = { id: Date.now(), ...req.body };
  bookmarks.push(newBookmark);
  res.status(201).json(newBookmark);
});

app.delete('/bookmarks/:id', (req, res) => {
  bookmarks = bookmarks.filter(b => b.id !== parseInt(req.params.id));
  res.status(204).send();
});

app.patch('/bookmarks/:id', (req, res) => {
  const index = bookmarks.findIndex(b => b.id === parseInt(req.params.id));
  if (index !== -1) {
    bookmarks[index] = { ...bookmarks[index], ...req.body };
    res.json(bookmarks[index]);
  } else {
    res.status(404).send('Bookmark not found');
  }
});

app.listen(8000, () => {
  console.log('Server listening on port 8000');
});
