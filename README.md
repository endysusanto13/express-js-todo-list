# Express JS TODO List

TODO List CRUD API with Express and Node for PowerX Fundamentals in Backend Development Module
## Usage

Set up postgres database _(Skip this step if your postgres is already setup)_
  - Go to https://www.postgresql.org/download/
  - Choose your OS family (e.g. Windows) and download the installer of. It is recommended to download the latest version.
  - Open the setup file and follow the instructions
  - It is not recommended to change the default values (port 5432 and path).
  - At the end of the process, you can uncheck the “Stack Builder” 
  checkbox.
  - pgAdmin and SQL shell (psql) should have been installed completely.

Once postgres is setup, 

Install project dependencies
```bash
$ npm install
```

Enter postgres environment variables in .env and .env.test (if you plan to use the test function)

Setup database by running migration script
```bash
$ npm run db:migrate
```

Start server
```bash
$ npm run start

# or in dev mode if you need nodemon
$ npm run dev
```
Visit http://localhost:3000/api-docs/ to view available APIs and to use it
<br>
To run test
```bash
$ npm run test
```

To delete all data in postgres, run clean up script
```bash
$ npm run db:cleanup
```
