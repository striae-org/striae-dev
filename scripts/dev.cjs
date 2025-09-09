const config = require('../app/config/config.json');
const fs = require('fs');
const path = require('path');

// Read the ASCII art file from the filesystem
const asciiArtPath = path.join(__dirname, '..', 'public', 'striae-ascii.txt');
const asciiArt = fs.readFileSync(asciiArtPath, 'utf8');

// Pop a lil' logo in the terminal
console.info(asciiArt);
