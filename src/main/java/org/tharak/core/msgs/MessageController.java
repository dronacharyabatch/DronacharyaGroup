package org.tharak.core.msgs;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLDecoder;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MessageController {
	private final static String TEMPLATE = "{0} :\n{1}";
	private final static String SQL_GROUP = "select * from dronabatch";
	private final static String SQL_FIND = "select sname from dronabatch where mobile = ?";
	private JdbcTemplate mTemplate = null;
	public MessageController(JdbcTemplate template) {
		mTemplate = template;
	}
	public List<Map<String,Object>> getUsers(){
		return mTemplate.queryForList(SQL_GROUP);
	}
	public String getFromUser(String from){
		return mTemplate.queryForObject(SQL_FIND, new Object[]{from}, String.class);
	}
	@RequestMapping(method = RequestMethod.POST, path = "/inComingMessage")
	public void inComingMessage(@RequestBody String msg) {
		System.out.println("inComingMessage called..");
		try {
			Map<String, String> result = splitQuery(msg);
			String SmsStatus = result.get("SmsStatus");
			System.out.println("SmsStatus :: " + SmsStatus);
			if ("received".equalsIgnoreCase(SmsStatus)) {
				String fromAddr = result.get("From");
				fromAddr = fromAddr.replace("whatsapp:", "");
				String bodyMsg = result.get("Body");
				String MediaContentType0 = result.get("MediaContentType0");
				List<Map<String,Object>> users = getUsers();
				String fromContact = getFromUser(fromAddr);
				for(Map<String,Object> user : users) {
					if(!user.get("is_block").toString().equals("0") || user.get("mobile").toString().equalsIgnoreCase(fromAddr)) {
						continue;
					}
					String message = MessageFormat.format(TEMPLATE, new Object[] { fromContact, bodyMsg });
					if (MediaContentType0 != null && MediaContentType0.trim().length() > 0) {
						ArrayList<URI> mediaUris = new ArrayList<URI>();
						mediaUris.add(URI.create(result.get("MediaUrl0")));
						MessageSender.sendImageMsg("whatsapp:"+user.get("mobile"), message, mediaUris);
					} else {
						MessageSender.sendMsg("whatsapp:"+user.get("mobile"), message);
					}
				}
			}

		} catch (Exception ex) {
			ex.printStackTrace();
		}

		System.out.println(msg);
	}
	@RequestMapping(method = RequestMethod.POST, path = "/statusOfMessage")
	public void statusOfMessage(@RequestBody String msg) {
		System.out.println("statusOfMessage called..");
		System.out.println(msg);
	}
	@RequestMapping(method = RequestMethod.POST, path = "/paramMessage")
	public void paramMessage(@RequestParam String msg) {
		System.out.println(msg);
	}
	public static Map<String, String> splitQuery(String query) throws UnsupportedEncodingException {
	    Map<String, String> query_pairs = new LinkedHashMap<String, String>();
	    String[] pairs = query.split("&");
	    for (String pair : pairs) {
	        int idx = pair.indexOf("=");
	        query_pairs.put(URLDecoder.decode(pair.substring(0, idx), "UTF-8"), URLDecoder.decode(pair.substring(idx + 1), "UTF-8"));
	    }
	    return query_pairs;
	}
}
