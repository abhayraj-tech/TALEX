/**
 * Simple JSON file-based database (no MongoDB needed).
 * Data persists in server/data/*.json files.
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonDB {
  constructor(collectionName) {
    this.name = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = [];
        this._save();
      }
    } catch (err) {
      console.error(`[DB] Error loading ${this.name}:`, err.message);
      this.data = [];
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[DB] Error saving ${this.name}:`, err.message);
    }
  }

  // Find all documents matching a filter (or return all)
  find(filter = {}) {
    let results = [...this.data];
    for (const [key, value] of Object.entries(filter)) {
      if (value && value.$regex) {
        const regex = new RegExp(value.$regex, value.$options || '');
        results = results.filter(doc => regex.test(doc[key]));
      } else if (value !== undefined && value !== null && value !== '') {
        results = results.filter(doc => doc[key] === value);
      }
    }
    return results;
  }

  // Find one document by filter
  findOne(filter = {}) {
    return this.find(filter)[0] || null;
  }

  // Find by ID
  findById(id) {
    return this.data.find(doc => doc._id === id) || null;
  }

  // Find multiple by IDs
  findByIds(ids) {
    return this.data.filter(doc => ids.includes(doc._id));
  }

  // Create a new document
  create(doc) {
    const newDoc = {
      _id: uuidv4(),
      ...doc,
      createdAt: new Date().toISOString()
    };
    this.data.push(newDoc);
    this._save();
    return newDoc;
  }

  // Update a document by ID
  updateById(id, updates) {
    const index = this.data.findIndex(doc => doc._id === id);
    if (index === -1) return null;
    this.data[index] = { ...this.data[index], ...updates };
    this._save();
    return this.data[index];
  }

  // Delete by ID
  deleteById(id) {
    const index = this.data.findIndex(doc => doc._id === id);
    if (index === -1) return false;
    this.data.splice(index, 1);
    this._save();
    return true;
  }

  // Clear all data
  clear() {
    this.data = [];
    this._save();
  }

  // Count documents
  count(filter = {}) {
    return this.find(filter).length;
  }
}

// Create collection instances
const collections = {};

function getCollection(name) {
  if (!collections[name]) {
    collections[name] = new JsonDB(name);
  }
  return collections[name];
}

module.exports = { getCollection, JsonDB };
