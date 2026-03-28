const crypto = require('crypto');

/**
 * Generate a cuid-like text ID.
 * Uses crypto.randomUUID() and strips dashes to create a compact text ID.
 */
const generateId = () => {
  return crypto.randomUUID().replace(/-/g, '');
};

module.exports = { generateId };
