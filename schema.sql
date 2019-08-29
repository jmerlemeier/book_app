CREATE DATABASE book_app;
go
USE book_app;
go
DROP TABLE IF EXISTS bookshelf;
go
CREATE TABLE bookshelf (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(20),
  image_url VARCHAR(255),
  description VARCHAR, 
  bookshelf VARCHAR(255) --genre of book?
);