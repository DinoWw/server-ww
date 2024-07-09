const express = require("express");
//const cookieParser = require('cookie-parser')
//const session = require('./sessions/session')

const app = express();
const https = require('https');
const http = require('http');

const fs = require("fs");
var path = require("path");

require('dotenv').config()

// run with npm run because it sets env variables
if(process.env.NODE_ENV === undefined){
   throw new Error("use npm run prod or npm run dev");
}

//body content parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// cookie-parsing middleware
// app.use(cookieParser());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", 'ejs');

app.use(express.static(path.join(__dirname, "public")));

// sets req.session
// app.use(session.sessionManager)




// loading of router paths
const routerFolders = fs.readdirSync(path.resolve(__dirname, "./routes"));
for( let routerFolder of routerFolders ) {
   if([".gitignore"].includes(routerFolder)) continue;
   const routerFile = fs.readdirSync(path.resolve(__dirname, "./routes", routerFolder)).find(name => name.endsWith(".routes.js"));
   const router = require(path.resolve(__dirname, "./routes", routerFolder, routerFile));
   app.use(router.path, router.router);
}


let server;

// use https in prod, http otherwise
if(process.env.NODE_ENV == 'production'){
   // certificates
   const privateKey = fs.readFileSync( '/etc/letsencrypt/live/netwwork.duckdns.org-0001/privkey.pem', 'utf8' );
   const certificate = fs.readFileSync( '/etc/letsencrypt/live/netwwork.duckdns.org-0001/cert.pem', 'utf8' );
   const ca = fs.readFileSync('/etc/letsencrypt/live/netwwork.duckdns.org-0001/chain.pem', 'utf8');

   server = https.createServer({
      key: privateKey,
      cert: certificate,
      ca: ca
   }, app);
   server.listen(process.env.HTTPS_PORT, () => console.log(`HTTPS server listening on port ${process.env.HTTPS_PORT}`));

   // redirect http requests to https
   const httpApp = express();
   httpApp.all('*', (req, res) => res.redirect(300, 'https://netwwork.duckdns.org' + req.originalUrl));
   const httpServer = http.createServer(httpApp);
   httpServer.listen(process.env.HTTP_PORT, () => console.log(`HTTP server listening on port ${process.env.HTTP_PORT}`));

}
else {
   server = http.createServer(app);
   server.listen(process.env.HTTP_PORT);
}
