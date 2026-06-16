const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || 'mysql://root@localhost:3306/notaris');
  
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`admin\` (
      \`id\` varchar(255) NOT NULL,
      \`username\` varchar(255) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`phone\` varchar(255) DEFAULT NULL,
      \`passwordHash\` varchar(255) NOT NULL,
      \`fullName\` varchar(255) NOT NULL,
      \`role\` enum('ADMINISTRATOR','PIMPINAN') NOT NULL DEFAULT 'ADMINISTRATOR',
      \`isActive\` tinyint(1) NOT NULL DEFAULT 1,
      \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`Admin_username_key\` (\`username\`),
      UNIQUE KEY \`Admin_email_key\` (\`email\`),
      UNIQUE KEY \`Admin_phone_key\` (\`phone\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  
  console.log("Admin table created successfully.");
  process.exit(0);
}

main().catch(console.error);
