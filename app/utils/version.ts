import packageJson from '../../package.json';

export const getAppVersion = () => {
  return packageJson.version;
};

export const logAppVersion = () => {
  // Version logging removed for production
};
