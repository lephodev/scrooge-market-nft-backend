import { createConnection } from 'mysql';
const db = createConnection({
host: "mysql.gb.stackcp.com",
port: 53094,
user: "casino-marketplace-35303035dcf1",
password: "8k0h0cbrjg",
database:"casino-marketplace-35303035dcf1" 
})

export default db;