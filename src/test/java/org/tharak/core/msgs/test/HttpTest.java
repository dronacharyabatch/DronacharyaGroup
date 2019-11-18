package org.tharak.core.msgs.test;

import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;

public class HttpTest {
	public static void main(String[] args) throws Exception {
		mainTest(args);
	}

	public static void mainTest(String[] args) throws Exception {
		HttpClient httpClient = HttpClientBuilder.create().build();
		HttpPost httpPost = new HttpPost("http://localhost:8080/inComingMessage");
		//HttpPost httpPost = new HttpPost("http://whatschat-whatschat.apps.us-east-2.online-starter.openshift.com/adminMessage");
		httpPost.setEntity(new StringEntity("MediaContentType0=image%2Fjpeg&SmsMessageSid=MM125f1b50a72e6883df7a3a75bcc56cb6&NumMedia=1&SmsSid=MM125f1b50a72e6883df7a3a75bcc56cb6&SmsStatus=received&Body=Hello&To=whatsapp%3A%2B14155238886&NumSegments=1&MessageSid=MM125f1b50a72e6883df7a3a75bcc56cb6&AccountSid=ACe99a5a3f0724897a9d9faac05b3b672c&From=whatsapp%3A%2B919573725224&MediaUrl0=https%3A%2F%2Fapi.twilio.com%2F2010-04-01%2FAccounts%2FACe99a5a3f0724897a9d9faac05b3b672c%2FMessages%2FMM125f1b50a72e6883df7a3a75bcc56cb6%2FMedia%2FME21a471363917430480386e702f566e43&ApiVersion=2010-04-01"));
		httpPost.setHeader("Content-Type", "text/plain");
		httpClient.execute(httpPost);
	}
}
