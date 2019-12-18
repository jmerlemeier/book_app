'use strict'

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const app = express();
const methodOverride  = require('method-override');
require('dotenv').config()
const PORT = process.env.PORT;
app.set('view engine', 'ejs');

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', (error) => console.error(error));
//middleware
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));
app.use(methodOverride((request, response) => {
  if(request.body && typeof request.body === 'object' && '_method' in request.body){
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}));
//routes
app.get('/', mySavedBooks); // books/show
app.get('/new', newSearch) // pages/index
app.get('/books/:isbn', getOneBook); // books/detail
app.get('/books/:isbn/update', updateMyBook) // books/edits
app.post('/book-search', searchForBook); //./pages/searches/show
app.get('/saved-books', mySavedBooks); // books/show
app.post('/add/:isbn', addBook);
app.delete('/books/:isbn', deleteBook);
app.put('/books/:isbn/update', editMyBook)

app.get('*', (request, response) => { response.status(404).render('pages/error')});

function editMyBook(request, response) {
  const id = request.params.isbn;
  const specificBook = request.body;
  const sqlUpdate = 'update bookshelf set title=$2, author=$3, description=$4, bookshelf=$5 where isbn=$1;'
  const sqlArray = [id, specificBook.title, specificBook.author, specificBook.description, specificBook.bookshelf]
  // console.log('bookshelf is ', bookshelf)
  client.query(sqlUpdate, sqlArray);
  response.redirect('/saved-books')
  // title, author, description, bokoshelf
}

function updateMyBook(request, response) {
  
  const id = request.params.isbn;
  client.query('select * from bookshelf where isbn=$1;', [id]).then(resultFromSQL => {
    response.render('./books/edits.ejs', {specificBook : resultFromSQL.rows[0]} );
  })

}

function deleteBook(request, response) {
  const id = request.params.isbn;

  client.query('delete from bookshelf where isbn=$1;', [id]);
  response.redirect('/');
}

function addBook(request, response) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${request.params.isbn}`;
  superagent.get(url).then(result => {
    const bookResults = result.body.items[0];
    let mySingleBook = new Book(bookResults);
    const sqlInsert = 'insert into bookshelf (author, title, isbn, image_url, description) values ($1, $2, $3, $4, $5);';
    const sqlArray = [mySingleBook.author, mySingleBook.title, mySingleBook.isbn, mySingleBook.image_url, mySingleBook.description];
    client.query(sqlInsert, sqlArray);
    response.redirect('/');
  })
}

function mySavedBooks(request, response) {
  client.query('select * from bookshelf;').then(resultFromSQL => {
    response.render('./books/show.ejs', {myBooks : resultFromSQL.rows, rowCount : resultFromSQL.rowCount} );
  })
}

function getOneBook(request, response) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${request.params.isbn}`;
  superagent.get(url).then(result => {
    // console.log(result.body.items);
    const bookResults = result.body.items[0];
    // console.log(bookResults)
    let mySingleBook = new Book(bookResults);
    response.render('./books/detail', {specificBook : mySingleBook, fullDescription : bookResults.volumeInfo})
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
    response.render('./pages/searches/show', {myBooks : formattedData}); //Can be just the formattedData instead of myBooks:formattedData
  }).catch(error => console.error(error))
  // }).catch(error => response.status(404).render('pages/error'));
}

function Book(book){
  this.image_url = book.volumeInfo.imageLinks && book.volumeInfo.imageLinks.smallThumbnail ? book.volumeInfo.imageLinks.smallThumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = book.volumeInfo.title ? book.volumeInfo.title : 'No Title Found';
  this.author = book.volumeInfo.authors ? book.volumeInfo.authors.join(' and ') : 'This book has no authors';
  this.description = book.volumeInfo.description ? book.volumeInfo.description : 'No Description Available';
  if (this.description.length > 254) this.description = this.description.slice(0, 250) + '...';
  this.isbn = book.volumeInfo.industryIdentifiers[0].identifier;
}

//===================================================

app.listen(PORT, () => console.log(`up on PORT ${PORT}`));
