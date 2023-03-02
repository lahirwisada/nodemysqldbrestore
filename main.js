const fs = require('fs');
const { exec } = require('child_process');
const cliProgress = require('cli-progress');
const { dialog } = require('electron');
const readline = require('readline');

// Define database credentials
let dbHost = 'localhost';
let dbPort = '3306';
let dbUser = 'root';
let dbPass = '';
let dbName = 'database_name';

// Define progress bar
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// Create readline interface for prompting user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for database port, username, and password
rl.question('Enter database port (default 3306): ', (port) => {
  if (port.trim() !== '') {
    dbPort = port.trim();
  }

  rl.question('Enter database username (default root): ', (username) => {
    if (username.trim() !== '') {
      dbUser = username.trim();
    }

    rl.question('Enter database password: ', (password) => {
      dbPass = password;

      // Show file browse dialog to choose SQL file
      dialog.showOpenDialog({
        filters: [
          { name: 'SQL files', extensions: ['sql'] }
        ]
      }).then(result => {
        if (result.canceled) {
          console.log('No file selected');
          rl.close();
          return;
        }
        const sqlFile = result.filePaths[0];

        // Read SQL file
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Define MySQL command to restore database
        const command = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} < ${sqlFile}`;

        // Execute MySQL command and display progress bar
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`Error: ${stderr}`);
            return;
          }
          console.log('Database restored successfully!');
        });

        // Display progress bar while restoring database
        progressBar.start(100, 0);
        let progress = 0;
        const interval = setInterval(() => {
          progress++;
          progressBar.update(progress);
          if (progress === 100) {
            clearInterval(interval);
            progressBar.stop();
          }
        }, 10);

        rl.close();
      }).catch(err => {
        console.error(err);
        rl.close();
      });
    });
  });
});
