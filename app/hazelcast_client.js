// app-bound services environment variables
module.exports = {
    new_hazelcast_client: function (callback) {
        if (process.env.VCAP_SERVICES) {
            var winston = require('winston');

            var Client = require('hazelcast-client').Client;
            var Config = require('hazelcast-client').Config;
            var Address = require('hazelcast-client').Address;
            var clientConfig = new Config.ClientConfig();

            var winstonAdapter = {
                logger: new (winston.Logger)({
                    level: 'debug',
                    transports: [
                        new (winston.transports.Console)()
                    ]
                }),

                levels: [
                    'error',
                    'warn',
                    'info',
                    'debug',
                    'silly'
                ],

                log: function(level, className, message, furtherInfo) {
                    this.logger.log(this.levels[level], '(@winstonAdapter) ' + className + ' ' + message);
                }
            };
            clientConfig.properties['hazelcast.logging'] = winstonAdapter;

            var servicesJson = JSON.parse(process.env.VCAP_SERVICES);
            var hazelcast = servicesJson.hazelcast;
            var map = hazelcast[0];
            var credentials = map.credentials;
            var groupName = credentials.groupName;
            var groupPass = credentials.groupPass;
            var members = credentials.members;
            console.log("map:");
            console.log(map);

            clientConfig.groupConfig.name = groupName;
            clientConfig.groupConfig.password = groupPass;

            console.log("clientConfig.networkConfig");
            console.log(clientConfig.networkConfig);
            clientConfig.networkConfig.addresses.length = 0;
            members.forEach(function(member) {
                var host;
                var port;
                // FIXME parse member into host and port (if ':' is present?)
                host = member.replace(/"/g, " ").trim();
                port = 5701;
                clientConfig.networkConfig.addresses.push(new Address(host, port));
            });

            // clientConfig.networkConfig.addresses.push(new Address('192.168.20.13', 5701));
            // clientConfig.networkConfig.addresses.push(new Address('192.168.20.14', 5701));
            // clientConfig.networkConfig.addresses.push(new Address('192.168.20.15', 5701));

            clientConfig.networkConfig.connectionAttemptLimit = 8;
            clientConfig.networkConfig.connectionAttemptPeriod = 20000;
            clientConfig.networkConfig.connectionTimeout = 20000;

            console.log("FINAL clientConfig");
            console.log(clientConfig);

            Client.newHazelcastClient(clientConfig).then(function (c) {
                console.log('newHazelcastClient returned with ' + c);
                callback(c);
            });
        }
    }
}