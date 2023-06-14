const fs = require('fs');
const path = require('path');

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js')
  .forEach(filename => {
    const moduleName = path.parse(filename).name;
    exports[moduleName] = require(path.join(__dirname, filename));
  });
