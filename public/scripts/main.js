require.config({
  shim: {

  },
  paths: {
    crafty: "../bower_components/crafty/dist/crafty",
    jquery: "../bower_components/jquery/dist/jquery",
    require: "../bower_components/requirejs/require",
    seedrandom: "../bower_components/seedrandom/seedrandom",
    shared: "../shared"
  },
  packages: [

  ]
});

requirejs(['./game']);
