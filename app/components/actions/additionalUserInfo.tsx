import { UserCredential, getAdditionalUserInfo as firebaseGetAdditionalUserInfo } from 'firebase/auth';

interface AdditionalUserInfo {
  isNewUser: boolean;
  profile: {
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    picture?: string;
  } | null;
  providerId: string | null;
}

export const getAdditionalUserInfo = (userCredential: UserCredential): AdditionalUserInfo => {
  if (!userCredential) {
    return {
      isNewUser: false,
      profile: null,
      providerId: null
    };
  }

  const fbAdditionalInfo = firebaseGetAdditionalUserInfo(userCredential);
  
  const additionalUserInfo: AdditionalUserInfo = {
    isNewUser: fbAdditionalInfo?.isNewUser || false,
    profile: fbAdditionalInfo?.profile as AdditionalUserInfo['profile'] || null,
    providerId: fbAdditionalInfo?.providerId || null
  };

  return additionalUserInfo;
};