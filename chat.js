'use strict';

const tellraw2dom = require('tellraw2dom');

module.exports = (clientmc) => {
  clientmc.handlers.chat = (event) => {
    clientmc.console.logNode(tellraw2dom(event.message.json));
  };

  // call the browser console.log() function with arguments as an array
  clientmc.nativeConsoleLog = (args) => {
    Function.prototype.bind.call(console.log, console).apply(console, args); // see http://stackoverflow.com/questions/5538972
  };

  // log to browser and to user console if available
  clientmc.log = (msg) => {
    const rest = []; //arguments.slice(1); // TODO
    clientmc.nativeConsoleLog(['[voxel-clientmc] ' + msg].concat(rest));  // as separate parameters to allow object expansion
    if (clientmc.console) clientmc.console.log(msg + ' ' + rest.join(' '));
  };

  clientmc.on('connectServer', () => {
    if (clientmc.console) clientmc.console.widget.on('input', this.onConsoleInput = (text) => {
      clientmc.mfworkerStream.write({cmd: 'chat', text: text});
    });
  });
  // TODO: remove listener on disconnect
};
