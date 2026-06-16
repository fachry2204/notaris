const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'notaris'
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(255) PRIMARY KEY,
        staffId VARCHAR(255) NOT NULL,
        \`date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checkIn DATETIME NULL,
        checkOut DATETIME NULL,
        status VARCHAR(255) NULL DEFAULT 'Hadir',
        notes TEXT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX attendance_staffId_fkey (staffId),
        INDEX attendance_date_idx (\`date\`)
      )
    `);
    console.log("Success");
  } catch (err) {
    console.error("SQL Error:", err.message);
  }
  await connection.end();
}

run();
