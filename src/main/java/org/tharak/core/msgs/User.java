package org.tharak.core.msgs;

public class User {
	private int sid;
	private String sName;
	private String mobile;
	private int isBlock;
	/**
	 * @return the sName
	 */
	public String getsName() {
		return sName;
	}
	/**
	 * @param sName the sName to set
	 */
	public void setsName(String sName) {
		this.sName = sName;
	}
	/**
	 * @return the mobile
	 */
	public String getMobile() {
		return mobile;
	}
	/**
	 * @param mobile the mobile to set
	 */
	public void setMobile(String mobile) {
		this.mobile = mobile;
	}
	/**
	 * @return the sid
	 */
	public int getSid() {
		return sid;
	}
	/**
	 * @param sid the sid to set
	 */
	public void setSid(int sid) {
		this.sid = sid;
	}
	/**
	 * @return the isBlock
	 */
	public int getIsBlock() {
		return isBlock;
	}
	/**
	 * @param isBlock the isBlock to set
	 */
	public void setIsBlock(int isBlock) {
		this.isBlock = isBlock;
	}
	/**
	 * @param sid
	 * @param sName
	 * @param mobile
	 * @param isBlock
	 */
	public User(int sid, String sName, String mobile, int isBlock) {
		this.sid = sid;
		this.sName = sName;
		this.mobile = mobile;
		this.isBlock = isBlock;
	}
}
