var _        = require('lodash');
var fs       = require('fs-extra');
var path     = require('path');
var options  = require('./options');

//
// For now we assume synchronous rendering
//

var anyErrors = false;

exports.toDisk = function(model) {

  var opts = options.get();
  _.forEach(opts.lint, function(options, name){
    lint(name, options, model);
  })

  if(anyErrors){
    process.exit(1)
  }
  if (opts.overwrite) {
    var list = require(process.cwd() + opts.overwrite).list;
    list.forEach(function(doc) {
      for(var index = 0; index < model.length; index++) {
        if(model[index].name == doc.name && model[index].hierarchy[0] == doc.describe) {
          model[index].name = doc.newName;
          model[index].hierarchy[1] = doc.newName;
          model[index].summary = doc.newSummary;
        }
      }
    });
  }
  _.forEach(opts.renderers, function(options, name) {
    render(name, options, model);
  });
  console.log('\nDone!\n');
};

function lint(name, options, model){
  var instance = null;
  try {
    instance = require('./linters/' + name);
  } catch(ex) {
    console.error('Unsupported linter: ' + name);
    return;
  }
  console.log('\n-> Linting ' + name);
  var errors = instance.lint(model, options).errors

  if(errors.length){
    var message = name + " found invalid samples: " + errors.join(", ");
    switch(options){
    case 1:
        console.warn('WARNING: ' + message)
        break;
      case 2:
        anyErrors = true;
        console.error('ERROR: ' + message)
        break;
    }
  }
}

function render(name, options, model) {
  var instance = null;
  try {
    instance = require('./renderers/' + name + '/index');
  } catch(ex) {
    console.error('Unsupported renderer: ' + name);
    return;
  }
  console.log('\n-> Building ' + name);
  instance.render(model, options);
}
