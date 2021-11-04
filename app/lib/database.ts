import mysql from 'mysql2/promise';

const connectionPromise = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
});

export let connection: mysql.Connection;

export async function connectToDatabase() {
  if (typeof connection === 'undefined') connection = await connectionPromise;
}
