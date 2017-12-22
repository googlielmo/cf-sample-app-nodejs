// Hazelcast client
module.exports = {
    new_hazelcast_client: function (withClient) {
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
                    this.logger.log(this.levels[level], className + ' ' + message);
                }
            };
            clientConfig.properties['hazelcast.logging'] = winstonAdapter;

            var servicesJson = JSON.parse(process.env.VCAP_SERVICES);
            var hazelcast = servicesJson.hazelcast;
            var map = hazelcast[0];
            var credentials = map.credentials;
            var groupName = credentials.group_name;
            var groupPass = credentials.group_pass;
            var members = credentials.members;

            clientConfig.groupConfig.name = groupName;
            clientConfig.groupConfig.password = groupPass;

            clientConfig.networkConfig.addresses.length = 0;
            members.forEach(function(member) {
                var host;
                var port;
                // FIXME parse member into host and port (if ':' is present)
                host = member.replace(/"/g, " ").trim();
                port = 5701;
                clientConfig.networkConfig.addresses.push(new Address(host, port));
            });

            Client.newHazelcastClient(clientConfig).then(function (c) {
                withClient(c);
            });
        }
    }
}