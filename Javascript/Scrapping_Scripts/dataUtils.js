const fs = require('fs');

function getOldData(filepath) {
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    } catch (e) {
        return [];
    }
}

module.exports = { getOldData };
