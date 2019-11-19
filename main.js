const https = require('https');
const fs = require('fs');
var btoa = require('btoa');
var mysql = require('mysql');
var TEMPLATE = "{0} :\n{1}";

const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
var options = {
  hostname: 'api.twilio.com',
  port: 443,
  path: '/2010-04-01/Accounts/AC11d13e6a48dc20dbfb4f4855856c006b/Messages.json',
  method: 'POST',
  headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
       "Authorization": "Basic " + btoa("AC11d13e6a48dc20dbfb4f4855856c006b:2f2b2e570f9ec7510033220f298c8951")
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
              throw err;
              return;     
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
	uriQry +='From=whatsapp:+14155238886&MessagingServiceSid=MGc4e79cdce326bc33ae1d5f46c823a5fc&';
	if(contact['MediaUrl'])
		uriQry +='MediaUrl='+contact['MediaUrl']+'&';
	uriQry +='Body='+message;
	return encodeURIData(uriQry);
}
https.createServer(httpsOptions, function (req, res) {
	var body = [];
	if(req.method === 'POST'){
		req.on('data', (chunk) => {
		body.push(chunk);
		}).on('end', () => {
			var bodyMsg = Buffer.concat(body).toString();
			var reqData = QueryStringToJSON(decodeURIComponent(bodyMsg));
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
				var message = formatMsg(TEMPLATE, [ sender.sname, reqData.Body ]);
				var MediaContentType0 = reqData["MediaContentType0"];
				group.forEach((item, index) =>{
					if (MediaContentType0 != null && MediaContentType0.trim().length > 0) {
						var mediaUris = [];
						item['MediaUrl'] = reqData["MediaUrl0"];
					}
					doMessage(getWhatsMessage(item, message));
				});
			});

		});
		
	}
  res.writeHead(200);
  res.end("Message sent\n");
}).listen(443);