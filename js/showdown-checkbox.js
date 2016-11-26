/**
 * Showdown's Extension boilerplate
 *
 * A boilerplate from where you can easily build extensions
 * for showdown
 */
(function (extension) {
  'use strict';

  // UML - Universal Module Loader
  // This enables the extension to be loaded in different environments
  if (typeof showdown !== 'undefined') {
    // global (browser or nodejs global)
    extension(showdown);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['showdown'], extension);
  } else if (typeof exports === 'object') {
    // Node, CommonJS-like
    module.exports = extension(require('showdown'));
  } else {
    // showdown was not found so we throw
    throw new Error('Could not find showdown library');
  }

}(function (showdown) {
  'use strict';

  //This is the extension code per se

  // Here you have a safe sandboxed environment where you can use "static code"
  // that is, code and data that is used accros instances of the extension itself
  // If you have regexes or some piece of calculation that is immutable
  // this is the best place to put them.

  // The following method will register the extension with showdown
  var finder = /([*+-]|\d+[.])\s\[[ xX]\].*/g;
  var matcher = /(([*+-]|\d+[.])\s)\[( |x|X)\](.*)/;
  var matches;
  var itr = 0;
  var repl;
  var id;

  showdown.extension('checkbox', function() {
    return {
      type: 'lang', //or output
      filter: function (text, converter, options) {
        // TODO: make sure I'm not breaking other html I guess
        text = text.replace(finder, function(match) {
          itr++;
          id = '__showdown-checkbox-input-' + Date.now() + itr;
          matches = match.match(matcher);
          repl = matches[1];
          repl += '<label for="' + id + '"><input class="__showdown-checkbox-input" id="' + id + '" type="checkbox"';
          if ( matches[3] !== ' ' ) {
            repl += ' checked';
          }
          repl += '>' + matches[4] + '</label>';
          return repl;
        });

        return text;
      }
    };
  });
}));