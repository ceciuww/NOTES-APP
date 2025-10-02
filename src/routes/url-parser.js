// URL parser for hash-based routing
export function parseUrl() {
  const hash = window.location.hash.slice(1) || '/';
  const [path, queryString] = hash.split('?');
  
  const params = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  
  return {
    path: path || '/',
    params
  };
}