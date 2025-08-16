import config from '~/config/config.json';

interface AppConfig {
  name: string;
  author: string;
  title: string;
  url: string;  
}

const { name, author, url } = config as AppConfig;
const defaultOgImage = `${url}/social-image.png`;


interface MetaParams {
  title: string;
  description: string;
  prefix?: string;
  ogImage?: string;
}

export function baseMeta({
  title: pageTitle,
  description,  
  ogImage = defaultOgImage,
}: MetaParams) {
  const titleText = `${name} | ${pageTitle}`;

  return [
    { title: titleText },
    { name: 'description', content: description },
    { name: 'author', content: author },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: 'Banner for the site' },
    { property: 'og:image:width', content: '1020' },
    { property: 'og:image:height', content: '484' },
    { property: 'og:title', content: titleText },
    { property: 'og:site_name', content: name },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:description', content: description },    
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:description', content: description },
    { property: 'twitter:title', content: titleText },
    { property: 'twitter:site', content: url },
    { property: 'twitter:creator', content: author },
    { property: 'twitter:image', content: ogImage },
  ];
}
