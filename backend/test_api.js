const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne({ role: 'Manager' });
    if (!user) {
        console.log('No manager found');
        return mongoose.connection.close();
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/metrics',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };

    const req = http.request(options, res => {
      console.log(`STATUS: ${res.statusCode}`);
      res.setEncoding('utf8');
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`BODY: ${body}`);
        mongoose.connection.close();
      });
    });

    req.on('error', e => {
      console.error(`problem with request: ${e.message}`);
      mongoose.connection.close();
    });
    req.end();
});
