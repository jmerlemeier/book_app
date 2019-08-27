'use strict'

const express = require('express');
const superagent = require('superagent');

const app = express();

app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

//BOOK CONSTRUCTOR
function Book(book){
  this.image_url = book.volumeInfo.imageLinks.smallThumbnail ? book.volumeInfo.imageLinks.smallThumbnail  : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = book.volumeInfo.title ? book.volumeInfo.title : 'No Title Found';
  this.author = book.volumeInfo.authors ? book.volumeInfo.authors.join(' and ') : 'This book has no authors';
  this.description = book.volumeInfo.description ? book.volumeInfo.description : 'No Description Available';
  if (this.description.length > 254) this.description = this.description.slice(0, 250) + '...';
}
//create a function. If missing s, insert an s. Loop through the string, if index[4] is not 
// 'http://www.com'
// 'https://www.com'

//MIDDLEWARE
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.get('/', newSearch);

app.post('/book-search', searchForBook)

//ROUTE HANDLERS
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

  }).catch(error => response.status(404).render('pages/error'));
};

app.get('*', (request, response) => { response.status(404).render('pages/error')
});

//===================================================

app.listen(PORT, () => console.log(`up on PORT ${PORT}`));
