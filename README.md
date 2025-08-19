Student Hub Web App

This is a full-stack web app student hub. It's a place where you can create events, upload files, and keep track of everything with a calendar its also a application in which student can join and view Societies and lastly get the latest information regarding whats happening  We built the frontend with React.js and the backend with PHP using XAMPP and MySQL.

Getting It Running

What You'll Need

 makee sure you have these installed on your machine:

For the Backend (PHP + MySQL):

* XAMPP: This tool gave me Apache, PHP, and MySQL all in one package.
* VS Code: Or any other code editor will do.

For the Frontend (React):

* Node.js & npm: Needed to run the React part.
* Git: Used for cloning the project from GitHub.

Backend Setup (PHP + MySQL)

Here’s how I got the backend running:

1. Cloned the repository:
   git clone [https://github.com/your-username/student-hub.git](https://github.com/your-username/student-hub.git)

2. Moved the backend files: We placed the backend folder inside the xampp/htdocs directory. So the path looked like this: /xampp/htdocs/student-hub/backend

3. Set up the database:

   * Opened the XAMPP Control Panel and started Apache and MySQL.
   * Went to [http://localhost/phpmyadmin](http://localhost/phpmyadmin) in my browser.
   * Created a new database named "student\_hub".
   * Created tables like users, events, etc.

4. Connected to the database:

   * Opened the db.php file located at backend/tools/db.php.
   * Used the default connection, which worked fine because I didn’t change my MySQL password:
     \$conn = new mysqli("localhost", "root", "", "student\_hub");

5. (Optional) Tested the API:

   * I used Postman to test routes like:
     POST [http://localhost/student-hub/backend/login.php](http://localhost/student-hub/backend/login.php)

Frontend Setup (React)

Here’s how I set up the React frontend:

1. Navigated into the project folder:
   cd student-hub

2. Installed all dependencies:
   npm install

3. Started the development server: npm start make sure you are in the frontend directory 

4. Opened the app in the browser: go to [http://localhost:3000](http://localhost:3000) everything should be working.

Folder Structure

I tried to keep everything organized and simple. Here’s what the project looks like:

student-hub/
|
├── backend/                  - This is where all the PHP code is.
│   ├── Event-creation.php    - Handles event creation.
│   ├── upload.php            - Handles file uploads.
│   └── tools/
│       └── db.php            - The database connection file.
|
├── src/                      - All the React frontend code.
│   ├── admin/
│   │   ├── CreateEvent.jsx   - The event creation form.
│   │   └── AdminSendFile.jsx - The file upload page for admins.
│   ├── App.js                - The main app component.
│   └── index.js              - React entry point.
|
├── public/                   - Static assets for the React app.
├── package.json              - Frontend dependencies and scripts.
└── What I Used

React Frontend:

* axios: For making HTTP requests to the backend.
* react-router-dom: For page navigation.
* @schedule-x/react: The calendar library I used.
* TailwindCSS/basic CSS: To style the components.

PHP Backend:

* MySQLi: To interact with the MySQL database.
* JSON: To pass data between the frontend and backend.
