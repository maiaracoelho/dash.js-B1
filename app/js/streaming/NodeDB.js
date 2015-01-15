var mysql = require('mysql');
 
var connection = mysql.createConnection(
    {
      host     : 'localhost',
      user     : 'root',
      password : 'mysql',
      database : 'dash_db',
    }
);
 
connection.connect();
 
var queryString = 'SELECT * FROM dash_bufferlevel';
 
connection.query(queryString, function(err, rows, fields) {
    if (err) throw err;
 
    for (var i in rows) {
        console.log('BufferLevel: ', rows[i].t);
    }
});
 
connection.end();