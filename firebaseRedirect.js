import axios from 'axios';
const redirector = async function(req, res) {
  try {
    const url = req.originalUrl;
    // const cookie = req.headers['cookie'] ?? '';
    const args = {
      baseURL: 'http://127.0.0.1:5000',
      transformResponse: (res) => res,
      responseType: 'json',
      // headers: {cookie},
      headers: req.headers,
      maxRedirects: 0,
      validateStatus: null,
    };
    console.log(`firebaseRedirect: url='${url}', args=${JSON.stringify(args)} `);
    const ax = await axios.get(url, args);
    const status = ax.status;
    Object.keys(ax.headers).forEach((key) => {
      res.setHeader(key, ax.headers[key]);
    });
    console.log(`fetch firebase: url='${url}', length=${ax.data.length}, status=${status}`);
    res.statusCode = status;
    res.end(ax.data);
  } catch (err) {
    console.log('error:');
    console.dir(err);
  }
};
export const firebaseRedirect = () => ({
  name: 'firebase-redirect',
  configureServer(server) {
    server.middlewares.use('/__/', redirector);
    server.middlewares.use('/fn/', redirector);
  },
});
