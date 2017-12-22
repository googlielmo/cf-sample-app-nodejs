var express = require('express')
var app = express()
var cf_app = require('./app/vcap_application')
var cf_svc = require('./app/vcap_services')
var hz_client = require('./app/hazelcast_client')
var hazelcastClient;

hz_client.new_hazelcast_client(function (c) {
    hazelcastClient = c;
});

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
    res.render('pages/index', {
        app_environment: app.settings.env,
        application_name: cf_app.get_app_name(),
        app_uris: cf_app.get_app_uris(),
        app_space_name: cf_app.get_app_space(),
        app_index: cf_app.get_app_index(),
        app_mem_limits: cf_app.get_app_mem_limits(),
        app_disk_limits: cf_app.get_app_disk_limits(),
        service_label: cf_svc.get_service_label(),
        service_name: cf_svc.get_service_name(),
        service_plan: cf_svc.get_service_plan()
    })
})

app.get('/get', function (req, res) {
    hazelcastClient.getMap("test").get(req.query.key).then(function (v) {
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(v));
    });
});

app.get('/put', function (req, res) {
    hazelcastClient.getMap("test").put(req.query.key, req.query.value).then(function (v) {
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(v));
    });
});

app.listen(process.env.PORT || 4000)
