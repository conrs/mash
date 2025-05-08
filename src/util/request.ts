//const XMLHttpRequest = window.XMLHttpRequest

export function request(obj: {
    method?: string,
    url: string,
    headers?: {[index: string]: string},
    body?: any
  }) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()
  
        xhr.open(obj.method || "GET", obj.url);
        if (obj.headers) {
          Object.keys(obj.headers).forEach(key => {
              xhr.setRequestHeader(key, obj.headers![key]);
          });
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response || xhr.responseText)
          } else {
              reject(xhr.statusText);
          }
        };
        xhr.onerror = (err:any) => {
            reject(xhr.statusText);
        }
        xhr.send(obj.body);
    });
  };