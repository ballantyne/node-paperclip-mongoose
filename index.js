const path        = require('path');
const Paperclip   = require('node-paperclip').paperclip;
const _           = require('underscore');

module.exports    = function paperclip (schema, opts) {
  var configuration = {};
  _.extend(configuration, opts);
  var configkeys                 = _.keys(configuration);
  for (i = 0; i < configkeys.length; i++) {
    var class_name           = configkeys[i];
    var files                = configuration[class_name];
    var paperclip            = new Paperclip(configuration);
    var keys                 = _.keys(files);

    var obj                = {};
    obj[class_name]        = {};

    schema.add(obj);

    for (i = 0; i < keys.length; i++) {
      var name               = keys[i];
      var options            = files[name];
      schema.pre('save', function (next) {
        var self = this;
        if (this.uploads == undefined) this.uploads = {};
        var upload                             = _.clone(this[name]);

        if (upload) {
          this.uploads[name]                   = upload;
          this.uploads[name].fieldname         = name;
          var save                             = this[name];
          save.created_at                      = new Date();
          this[name]                           = paperclip.toSave(save);
          paperclip[class_name].document       = this;
          paperclip[class_name][name].file     = upload
          paperclip.beforeSave(class_name, name, function(err, doc) {
            _.extend(self[name], doc);
            next();
          })
        } else {
          next()
        }
      })

      schema.post('save', function (doc, next) {
        var upload                             = this.uploads[name];
        if (upload) {
          paperclip[class_name].document       = doc;
          paperclip[class_name][name].file     = upload;
          paperclip.afterSave(class_name, name, function(err, result) {
            next()
          })
        } else {
          next();
        }
      }) 

      schema.pre("update", function(next) {
        if (this.uploads == undefined) this.uploads = {};
        var upload                             = _.clone(this[name]);
        if (upload) {
          this.uploads[name]                   = upload;
          this.uploads[name].fieldname         = name;
          this[name]                           = paperclip.toSave(this[name]);
          paperclip[class_name].document       = this;
          paperclip[class_name][name].file               = upload
          paperclip.beforeSave(class_name, name, function(err, doc) {
            _.extend(self[name], doc)
              next()
          })
        } else {
          next()
        }
      });

      schema.post('update', function(error, res, next) {
        var upload                             = this.uploads[name];
        if (upload) {
          paperclip[class_name].document       = doc;
          paperclip[class_name][name].file     = upload;
          paperclip.afterSave(class_name, name, function(err, result) {
            next()
          })
        } else {
          next();
        }
      });

      schema.post('remove', function (doc) {
        paperclip[class_name].document         = doc;
        paperclip.afterRemove(class_name, name, function(err, result) {
          console.log('deleted', doc.constructor.modelName, doc._id);
        })
      }) 
    }

  }
}

