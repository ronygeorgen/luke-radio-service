export const APP_NAME = 'Podcast Researcher';

export const formatPageTitle = (pageTitle) => {
  if (!pageTitle) return APP_NAME;
  return `${pageTitle} | ${APP_NAME}`;
};
