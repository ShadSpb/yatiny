"use strict";

const hdbext = require("@sap/hdbext");

const hanaConfig = {
	host: "ip-172-31-44-116.eu-west-1.compute.internal",
	port: 30015,
	user: "SYSTEM",
	password: "P@ssw0rd1"
};

function connect() {
	return new Promise((resolve, reject) => {
		hdbext.createConnection(hanaConfig,
			function(error, connection) {
				if (error) {
					reject(error);
				} else {
					resolve(connection);
				}
			});
	});
}

function exec(query) {
	return connect().then(connection => {
		return new Promise((resolve, reject) => {
			connection.exec(query, null,
				function(err, result) {
					if (err) {
						console.log(`______________ \n HANA Error:\n ${query} \n ${err} \n ______________`);
						connection.close();
						reject(err);
					} else {
						console.log(`Executed successfully: ${query} Success`);
						connection.close();
						resolve(result);
					}
				}
			);
		});
	});
}

exports.exec = exec;
exports.connect = connect;
