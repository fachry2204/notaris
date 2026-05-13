const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const backupDir = path.join(__dirname, "../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const fileName = `backup-${timestamp}.sql`;
const filePath = path.join(backupDir, fileName);

// Note: This assumes mysqldump is in the PATH
const command = `mysqldump -u root notaris > ${filePath}`;

console.log(`Starting backup: ${fileName}...`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error: ${stderr}`);
  }
  console.log(`Backup completed successfully: ${filePath}`);
});
