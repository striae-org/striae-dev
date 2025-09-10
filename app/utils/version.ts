import packageJson from '../../package.json';

export const getAppVersion = () => {
  return packageJson.version;
};

export const logAppVersion = () => {
  console.log(`App version: ${packageJson.version}`);
};
