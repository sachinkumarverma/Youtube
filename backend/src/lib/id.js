const crypto = require('crypto');

/**
 * Generate a cuid-like text ID compatible with Prisma's original ID format.
 * Uses crypto.randomUUID() and strips dashes to create a compact text ID.
 */
const generateId = () => {
  return crypto.randomUUID().replace(/-/g, '');
};

module.exports = { generateId };
