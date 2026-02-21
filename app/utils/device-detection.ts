const mobileOrTabletUserAgentPattern = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|tablet|silk|kindle|playbook|webos|windows phone/i;

export const isMobileOrTabletUserAgent = (userAgent: string): boolean => {
	return mobileOrTabletUserAgentPattern.test(userAgent);
};