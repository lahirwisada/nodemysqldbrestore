const fs = require('fs');
const { exec,execSync } = require('child_process');
const cliProgress = require('cli-progress');
const { Spinner } = require('cli-spinner');
const { dialog } = require('electron');
const readline = require('readline');
const { join } = require('path');

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
      if(!dbPass){
        console.error(`Error: Password cannot NULL`);
        return;
      }
      rl.question('Enter database name: ', (dbName) => {
        if(!dbName){
          console.error(`Error: database name cannot NULL`);
          return;
        }
        // Show file browse dialog to choose SQL file

        const filePath = execSync(`powershell.exe -Command "& { Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.OpenFileDialog; $dialog.InitialDirectory = '${__dirname}'; $dialog.Filter = 'SQL Files (*.sql)|*.sql|All Files (*.*)|*.*'; $dialog.ShowDialog() | Out-Null; $dialog.FileName }"`, { encoding: 'utf-8' }).trim();
        if(filePath){

          const spinner = new Spinner('Restoring database... %s');
          spinner.start();

          const sqlFile = filePath;

          // Read SQL file
          const sql = fs.readFileSync(sqlFile, 'utf8');

          // Define MySQL command to restore database
          const command = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} < ${sqlFile}`;

          // Execute MySQL command and display progress bar
          const restoreProcess = exec(command);

          restoreProcess.on('exit', () => {
            spinner.stop();
            console.log('Database restore complete!');
          });
          
          restoreProcess.stderr.on('data', (data) => {
            if(!data.includes('Using a password on the command line interface')){
              console.error(`Error: ${data}`);
            }
            
          });
          
          restoreProcess.stdout.on('data', (data) => {
            console.log(data);
          });

          // Display progress bar while restoring database
          // progressBar.start(100, 0);
          // let progress = 0;
          // const interval = setInterval(() => {
          //   progress++;
          //   progressBar.update(progress);
          //   if (progress === 100) {
          //     clearInterval(interval);
          //     progressBar.stop();
          //   }
          // }, 10);

          rl.close();
        }else{
          rl.close();
          return;
        }
        /**
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
        */
      });
    });
  });
});
