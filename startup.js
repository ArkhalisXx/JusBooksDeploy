/**
 * startup.js — Auto-seeds the database on first run if empty,
 * then starts the server. Used as the Railway entry point.
 */

require('dotenv').config();
const { User } = require('./models/User');
const db = require('./database/db');
require('./database/setup');

setTimeout(async () => {
  try {
    // Check if already seeded
    db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
      if (err || row.count > 0) {
        // Already has data — just start the server
        require('./server');
        return;
      }

      console.log('📦 First run detected — seeding database...');

      const librarianPassword = await User.hashPassword('librarian123');
      const memberPassword    = await User.hashPassword('member123');

      db.run(
        `INSERT OR IGNORE INTO users (username, email, password, role, membership_status, borrow_limit, outstanding_fines)
         VALUES (?, ?, ?, 'librarian', 'active', 0, 0)`,
        ['Admin Librarian', 'librarian@jusbooks.com', librarianPassword]
      );

      db.run(
        `INSERT OR IGNORE INTO users (username, email, password, role, membership_status, borrow_limit, outstanding_fines)
         VALUES (?, ?, ?, 'member', 'active', 5, 0)`,
        ['Maria Santos', 'maria@example.com', memberPassword]
      );

      const books = [
        ['Noli Me Tangere',          'José Rizal',          '9789711804107', 'Fiction',     5, 5, 'Landmark novel of the Philippine literary canon.'],
        ['El Filibusterismo',         'José Rizal',          '9789711804114', 'Fiction',     3, 3, 'Sequel to Noli Me Tangere.'],
        ['Thinking, Fast and Slow',   'Daniel Kahneman',     '9780374533557', 'Non-Fiction', 4, 4, 'Explores dual-process theory of the mind.'],
        ['Clean Code',                'Robert C. Martin',    '9780132350884', 'Technology',  6, 6, 'A handbook of agile software craftsmanship.'],
        ['Sapiens',                   'Yuval Noah Harari',   '9780062316097', 'History',     5, 5, 'A brief history of humankind.'],
        ['The Great Gatsby',          'F. Scott Fitzgerald', '9780743273565', 'Fiction',     4, 4, 'The Jazz Age and the American Dream.'],
        ['The Art of War',            'Sun Tzu',             '9780981952208', 'Philosophy',  7, 7, 'Ancient Chinese military treatise.'],
        ['Introduction to Algorithms','Cormen et al.',       '9780262033848', 'Technology',  3, 3, 'Comprehensive algorithms textbook.'],
      ];

      for (const [title, author, isbn, category, qty, availQty, desc] of books) {
        db.run(
          `INSERT OR IGNORE INTO books (title, author, isbn, category, quantity, available_qty, description)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [title, author, isbn, category, qty, availQty, desc]
        );
      }

      console.log('✅ Database seeded.');
      setTimeout(() => require('./server'), 300);
    });
  } catch (e) {
    console.error('Startup error:', e.message);
    require('./server');
  }
}, 600);
