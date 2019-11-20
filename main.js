const http = require('http');
const https = require('https');
//const fs = require('fs');
//var btoa = require('btoa');
var mysql = require('mysql');
var TEMPLATE = "{0} :\n{1}";

/*const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};*/
var options = {
  hostname: 'api.twilio.com',
  port: 443,
  path: '/2010-04-01/Accounts/AC54c8d9f580eb20876f4c0b300a04ed46/Messages.json',
  method: 'POST',
  headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
       "Authorization": "Basic QUM1NGM4ZDlmNTgwZWIyMDg3NmY0YzBiMzAwYTA0ZWQ0NjozM2E4OWM0YTQwZGRkZGY1YmJjYmMzZTNmYTQ5NjMzNw=="
     }
};
// Initialize pool
var pool      =    mysql.createPool({
    connectionLimit : 10,
    host     : 'remotemysql.com',
    user     : '7IMrocUvYo',
    password : '8jUJ8cDtKv',
    database : '7IMrocUvYo',
    debug    :  false
});
function doMessage(strQuery){
	strQuery = encodeURIData(strQuery);
	var req = https.request(options, (res) => {
	  console.log('statusCode:', res.statusCode);
	  console.log('headers:', res.headers);

	  res.on('data', (d) => {
		console.log(d.toString());
	  });
	});

	req.on('error', (e) => {
	  console.error(e);
	});
	req.write(strQuery);
	req.end();
}
function formatMsg(source, args){
	var target = '';
	target = source.replace(/\{(\d+)\}/g, function(a) {
        return args[parseInt(a.match(/(\d+)/g))];
    });
	return target;
}
function encodeURIData(strQuery){
	strQuery = strQuery.replace(/:/g, '%3A');
	strQuery = strQuery.replace(/\+/g, '%2B');
	//strQuery = strQuery.replace(/ /g, '+');
	return strQuery;
}
function executeQuery(query,callback){
	pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          throw err;
        }   
        connection.query(query,function(err,rows){
            connection.release();
            if(!err) {
                callback(null, rows);
            }           
        });
        connection.on('error', function(err) {
			console.log(err);
              /*throw err;
              return;   */  
        });
    });
}
function QueryStringToJSON(str) {
	var pairs = str.split('&');
	var result = {};
	pairs.forEach(function (pair) {
		pair = pair.split('=');
		var name = pair[0]
		var value = pair[1]
		if (name.length)
			if (result[name] !== undefined) {
				if (!result[name].push) {
					result[name] = [result[name]];
				}
				result[name].push(value || '');
			} else {
				result[name] = value || '';
			}
	});
	return (result);
}
function getWhatsMessage(contact, message){
	var uriQry = '';
	var idx=0;
	uriQry +='To='+contact.mobile+'&';
	uriQry +='From=whatsapp:+14155238886&';
	if(contact['MediaUrl']){
		contact['MediaUrl'].forEach((mediaUrl) => {
			uriQry +='MediaUrl='+mediaUrl+'&';
		});
		
	}
	uriQry +='Body='+message;
	return encodeURIData(uriQry);
}
function status(reqData){
	console.log('statusCallback');
	console.log(reqData);
}
function recieved(reqData){
	var group = [];
	var sender;
	executeQuery('select * from dronabatch', (status, result)=>{
		result.forEach((item, index) =>{
			if(item.is_block !== 0)
				return;
			if(reqData.From === item.mobile){
				sender = item;
				return;
			}
			group.push(item);
			
		});
		console.log(sender);
		var message = formatMsg(TEMPLATE, [ sender.sname, reqData.Body ]);
		var MediaContentType0 = reqData["MediaContentType0"];
		var mediaUris = [];
		if (MediaContentType0 != null && MediaContentType0.trim().length > 0) {
			var idx=0;
			while(reqData["MediaUrl"+idx] !== undefined){
				mediaUris.push(reqData["MediaUrl"+idx]);
				idx++;
			}
		}
		group.forEach((item, index) =>{
			if (mediaUris.length > 0) {
				item['MediaUrl'] = mediaUris;
			}
			doMessage(getWhatsMessage(item, message));
		});
	});
}
http.createServer(function (req, res) {
	var body = [];
	if(req.method === 'POST'){
		console.log(req.url);
		req.on('data', (chunk) => {
		body.push(chunk);
		}).on('end', () => {
			var bodyMsg = Buffer.concat(body).toString();
			var reqData = QueryStringToJSON(decodeURIComponent(bodyMsg));
			if('/recieved' === req.url)
				recieved(reqData);
			else if('/status' === req.url)
				status(reqData);

		});
		
	}
  res.writeHead(200);
  res.end("Message sent\n");
}).listen(8080);
