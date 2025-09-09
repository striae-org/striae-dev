const fs = require('fs');
const path = require('path');

// Read the ASCII art file from the filesystem
const asciiArtPath = path.join(__dirname, '..', 'public', 'striae-ascii.txt');
let asciiArt;  
try {  
    asciiArt = fs.readFileSync(asciiArtPath, 'utf8');  
} catch (err) {  
    console.error(`Error: Unable to read ASCII art file at ${asciiArtPath}.\n${err.message}`);  
    process.exit(1);  
} 

// Pop a lil' logo in the terminal
console.info(asciiArt);
