// server.js
const http = require('http');
const fs = require('fs').promises;
const url = require('url');
const path = require('path');

// Define the port
const PORT = 3000;

// Path to the books.json file
const DATA_FILE = path.join(__dirname, 'books.json');

// Helper function to read data
const readData = async () => {
  try {
    const jsonData = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
};

// Helper function to write data
const writeData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

// Helper function to set CORS headers
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Create the server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes for CRUD operations
  if (pathname.startsWith('/books')) {
    setCORSHeaders(res);

    // GET /books - Retrieve all books
    if (method === 'GET' && pathname === '/books') {
      const books = await readData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(books));
      return;
    }

    // GET /books/:id - Retrieve a single book by ID
    if (method === 'GET' && /^\/books\/\d+$/.test(pathname)) {
      const id = parseInt(pathname.split('/')[2]);
      const books = await readData();
      const book = books.find(b => b.id === id);
      if (book) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(book));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Book not found' }));
      }
      return;
    }

    // POST /books - Create a new book
    if (method === 'POST' && pathname === '/books') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const newBook = JSON.parse(body);
          const books = await readData();
          newBook.id = books.length ? books[books.length - 1].id + 1 : 1;
          books.push(newBook);
          await writeData(books);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newBook));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid JSON data' }));
        }
      });
      return;
    }

    // PUT /books/:id - Update an existing book
    if (method === 'PUT' && /^\/books\/\d+$/.test(pathname)) {
      const id = parseInt(pathname.split('/')[2]);
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const updatedBook = JSON.parse(body);
          const books = await readData();
          const index = books.findIndex(b => b.id === id);
          if (index !== -1) {
            books[index] = { ...books[index], ...updatedBook };
            await writeData(books);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(books[index]));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Book not found' }));
          }
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid JSON data' }));
        }
      });
      return;
    }

    // DELETE /books/:id - Delete a book
    if (method === 'DELETE' && /^\/books\/\d+$/.test(pathname)) {
      const id = parseInt(pathname.split('/')[2]);
      const books = await readData();
      const initialLength = books.length;
      const updatedBooks = books.filter(b => b.id !== id);
      if (updatedBooks.length < initialLength) {
        await writeData(updatedBooks);
        res.writeHead(204);
        res.end();
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Book not found' }));
      }
      return;
    }

    // If no route matches
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found' }));
    return;
  }

  // If route not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Route not found' }));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
