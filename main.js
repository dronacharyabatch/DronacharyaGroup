const http = require('http');
const https = require('https');
//const fs = require('fs');
var mysql = require('mysql');
var TEMPLATE = "{0} :\n{1}";
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
function doMessage(strQuery, callback){
	//strQuery = encodeURIData(strQuery);
	var req = https.request(options, (res) => {
	  //console.log('statusCode:', res.statusCode);
	  //console.log('headers:', res.headers);

	  res.on('data', (d) => {
		console.log(d.toString());
	  });
	});

	req.on('error', (e) => {
	  console.error(e);
	});
	req.write(strQuery);
	req.end();
	callback(200);
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
            }else{
				console.log(err);
				callback(null);
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
	uriQry = encodeURIData(uriQry);
	console.log('uriQry :: '+uriQry);
	return uriQry;
}
function status(reqData){
	console.log('statusCallback');
	//console.log(reqData);
}
function findBodyJson(opr, reqData){
	reqData.Body = reqData.Body.replace(opr, '');
	var data = reqData.Body.split(':');
	reqData.BodyJson = {};
	for(var idx=0; idx<data.length; idx+=2){
		var name = data[idx];
		var bgData = data[idx+1];
		if(name === 'mobile')
			bgData = 'whatsapp:+91'+bgData;
		reqData.BodyJson[name] = bgData;
	}
}
function recieved(reqData, callback){
	if(!reqData.Body.startsWith('find:') && !reqData.Body.startsWith('add:') && !reqData.Body.startsWith('del:')){
		processGroup(reqData, callback);
		return;
	}
	checkAccess(reqData, function(status){
		if(status === 401){
			doMessage(getWhatsMessage({mobile:reqData.From}, "You must be Admin"), callback);
			return;
		}
		if(reqData.Body.startsWith('find:')){
			findBodyJson('find:', reqData);
			find(reqData.BodyJson, function(result){
				var mobile = result.mobile.replace('whatsapp:+91','');
				doMessage(getWhatsMessage({mobile:reqData.From}, "name : "+result.name+"\nmobile : "+mobile+"\nisBlocked : "+((result.is_block === 1)?'Yes':'No')), callback);			
			});
		}else if(reqData.Body.startsWith('add:')){
			var message = 'Contact Not Added.';
			findBodyJson('add:', reqData);
			find(reqData.BodyJson, function(result){
				if(result){
					remove(result, function(result1){
						if(result1){
							insert(reqData.BodyJson, function(result2){
							if(result2){
								message = formatMessage(reqData, '\nAdded.');
							}
							doMessage(getWhatsMessage({mobile:reqData.From}, message), callback);
							});
						}
					});
				}else{
					insert(reqData.BodyJson, function(result1){
						if(result1){
							message = formatMessage(reqData, '\nAdded.');
						}
						doMessage(getWhatsMessage({mobile:reqData.From}, message), callback);
					});
				}
			});
		}else if(reqData.Body.startsWith('del:')){
			var message = 'Contact Not Found';
			findBodyJson('del:', reqData);
			find(reqData.BodyJson, function(result){
				if(result){
					remove(result, function(result1){
							if(result1){
								message = formatMessage(reqData, "\n Removed");
							}
						doMessage(getWhatsMessage({mobile:reqData.From}, message), callback);			
					});
				}else{
					doMessage(getWhatsMessage({mobile:reqData.From}, message), callback);			
				}
			});
		}
	});
}
function formatMessage(reqData, endMsg){
	var message = '';
	if(reqData.BodyJson.name)
		message += "name : "+reqData.BodyJson.name;
	if(reqData.BodyJson.mobile){
		var mobile = reqData.BodyJson.mobile.replace('whatsapp:+91','');
		message += "\nmobile : "+mobile;
	}
	message += endMsg;
	return message;
}
function insert(reqData, callback){
	if(!reqData.is_block)
		reqData.is_block = "0";
	if(!reqData.role)
		reqData.role = "0";
	var query = "insert into dronateam(name, mobile, is_block, role) values('"+reqData.name+"', '"+reqData.mobile+"', "+reqData.is_block+", "+reqData.role+")";
	executeQuery(query, (status, resultData)=>{
		callback(resultData);
	});
}
function remove(reqData, callback){
	var query = "delete from dronateam where mobile='"+reqData.mobile+"'";
	executeQuery(query, (status, resultData)=>{
		callback(resultData);
	});
}
function checkAccess(reqData, callback){
	var query = "select role,is_block from dronateam where mobile='"+reqData.From+"'";
	executeQuery(query, (status, resultData)=>{
		var result = resultData[0];
		if(result.role === 0){
			callback(401);
		}else{
			callback(200);
		}
	});
}
function find(reqData, callback){
	var isAnd = false;
	var query = "select mobile,name,role,is_block from dronateam where ";
	if(reqData.mobile){
		query +="mobile='"+reqData.mobile+"'";
		isAnd = true;
	}
	if(reqData.name){
		if(isAnd)
			query +=" AND ";
		query +="name='"+reqData.name+"'";
	}
	executeQuery(query, (status, resultData)=>{
		var result;
		if(resultData.length > 0)
			result = resultData[0];
		callback(result);
	});
}

function processGroup(reqData, callback){
	var group = [];
	var sender;
	executeQuery('select * from dronateam', (status, result)=>{
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
		var message = formatMsg(TEMPLATE, [ sender.name, reqData.Body ]);
		console.log("message :: "+message);
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
			doMessage(getWhatsMessage(item, message), callback);
		});
	});
}

http.createServer(function (req, res) {
	var fMsg = "Message sent\n";
	var body = [];
	console.log(req.url);
	if(req.method === 'POST'){
		req.on('data', (chunk) => {
		body.push(chunk);
		}).on('end', () => {
			var bodyMsg = Buffer.concat(body).toString();
			var reqData = QueryStringToJSON(decodeURIComponent(bodyMsg));
			if('/recieved' === req.url){
				recieved(reqData, (status)=> {
					res.writeHead(status);
					res.end(fMsg);
				});
			}else if('/status' === req.url){
				status(reqData, ()=> {
					res.writeHead(200);
					res.end(fMsg);
				});
			}
			console.log(fMsg);
		  
		});
	}else{
		res.end('Requested resource Not available.');
		res.writeHead(404);
	}
}).listen(8080);
