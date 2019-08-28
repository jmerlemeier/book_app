'use strict'

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config()
app.set('view engine', 'ejs');

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', (error) => console.error(error));

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));
app.get('/', mySavedBooks);
app.get('/new', newSearch)
app.get('/books/:isbn', getOneBook);
app.post('/book-search', searchForBook);
app.get('/saved-books', mySavedBooks);
app.post('/add', addBook);

function addBook(request, response) {
  const bookData = request.body;
  const sqlInsert = 'INSERT INTO bookshelf (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);'
  const sqlArray = [bookData.author, bookData.title, bookData.isbn, bookData.image_url, bookData.description, bookData.bookshelf]
  client.query(sqlInsert, sqlArray)
  response.redirect('/');
  //Log things into SQL
}

function mySavedBooks(request, response) {
  client.query('select * from bookshelf;').then(resultFromSQL => {
    response.render('./books/show.ejs', {myBooks : resultFromSQL.rows, rowCount : resultFromSQL.rowCount} );
  })
}

function getOneBook(request, response) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${request.params.isbn}`;
  superagent.get(url).then(result => {
    const bookResults = result.body.items[0];
    let mySingleBook = new Book(bookResults);
    response.render('./books/detail', {specificBook : mySingleBook})
  })
}

function newSearch(request, response){
  response.render('pages/index.ejs');
}

function searchForBook(request, response){
  const searchType = request.body.search[0];

  const searchingFor = request.body.search[1];
  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if(searchType === 'title') {
    const query = `+intitle:${searchingFor}`
    url = url + query;
  } else {
    const query = `+inauthor:${searchingFor}`
    url = url + query;
  }

  superagent.get(url).then(result => {
    const bookResults = result.body.items;
    const formattedData = bookResults.slice(0, 10).map(book => {
      return new Book(book);
    })
    response.render('./pages/searches/show', {myBooks : formattedData});
  }).catch(error => console.error(error))
  // }).catch(error => response.status(404).render('pages/error'));
}

const regex = /http/g;

function Book(book){
  this.image_url = book.volumeInfo.imageLinks && book.volumeInfo.imageLinks.smallThumbnail ? book.volumeInfo.imageLinks.smallThumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = book.volumeInfo.title ? book.volumeInfo.title : 'No Title Found';
  this.author = book.volumeInfo.authors ? book.volumeInfo.authors.join(' and ') : 'This book has no authors';
  this.description = book.volumeInfo.description ? book.volumeInfo.description : 'No Description Available';
  if (this.description.length > 254) this.description = this.description.slice(0, 250) + '...';
  this.ISBN = book.volumeInfo.industryIdentifiers[0].identifier;
}

app.get('*', (request, response) => { 
  response.status(404).render('pages/error')
  // error => console.log(error)
});

//===================================================

app.listen(PORT, () => console.log(`up on PORT ${PORT}`));
