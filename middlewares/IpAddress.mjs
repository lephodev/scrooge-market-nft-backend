export const getIpAdress = (stringWithPrefix) => {
  const stringWithoutPrefix = stringWithPrefix?.replace("::ffff:", "");
  return stringWithoutPrefix;
};
