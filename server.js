'use strict'

const express = require('express');
const superagent = require('superagent');

const app = express();

app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

//MIDDLEWARE
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.get('/', newSearch);

// app.post('/book-search', searchForBook)

//Route Handlers
function newSearch(request, response){
  response.render('pages/index.ejs');
}


//===================================================

app.listen(PORT, () => console.log(`up on PORT ${PORT}`));