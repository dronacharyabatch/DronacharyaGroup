package org.tharak.core.msgs;

import java.net.URI;
import java.util.List;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.rest.api.v2010.account.MessageCreator;

public class MessageSender {
    public static final String ACCOUNT_SID = "AC11d13e6a48dc20dbfb4f4855856c006b";
    public static final String AUTH_TOKEN = "2f2b2e570f9ec7510033220f298c8951";
    public static final String GROUP_NUM = "whatsapp:+14155238886";
    public static void sendMsg(String mobileNum, String txtMessage) {
    	System.out.println("sendMsg called..");
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message = Message.creator(
                new com.twilio.type.PhoneNumber(mobileNum),
                new com.twilio.type.PhoneNumber("whatsapp:+14155238886"),
                txtMessage)
            .create();

        System.out.println(message.getSid());    	
    }
    public static void sendImageMsg(String mobileNum, String txtMessage, List<URI> media) {
    	System.out.println("sendImageMsg called..");
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        MessageCreator msgCreater = Message.creator(
                new com.twilio.type.PhoneNumber(mobileNum),
                new com.twilio.type.PhoneNumber(GROUP_NUM),
                media);
        msgCreater.setBody(txtMessage);
        Message message = msgCreater.create();
        System.out.println(message.getSid());    	
    }
}
