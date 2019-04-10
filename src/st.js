import { executors as valueExecutors } from "./value-executors";
import { executors as arrayExecutors } from "./array-executors";
import { executors as keyExecutors } from "./key-executors";
import { Helper, StErrors } from "./Common";

class Transform {
  constructor(select, st) {
    this.select = select;
    this.st = st;
  }

  run(template, data) {
    let result;
 
    if (typeof template === "string") {
      if (!Helper.is_template(template)) return template;

      for (const executor of valueExecutors){
        if (executor.getInstance().fits(template)){
          return executor.getInstance().execute(template, data, this);
        }
      }

      try {
        return Helper.fillout(template, data);
      } catch (error) {
        return `${error.message} -- ${template}`;
      }
    }

    if (Helper.is_array(template)) {
      for (const executor of arrayExecutors){
        if (executor.getInstance().fits(template)){
          return executor.getInstance().execute(template, data, this);
        }
      }

      return template.map(item => this.run(item, data));
    } else if (Object.prototype.toString.call(template) === "[object Object]") {
      // template is an object
      result = {};

      for (const key in template){
        if (!Helper.is_template(key)) {
          result[key] = this.run(template[key], data);
          continue;
        }

        for(const executor of keyExecutors) {
          if (executor.getInstance().fits(template)) {
            return executor.getInstance().execute(template, data, this);
          }
        }

        result[key] = `${StErrors.format.message} -- ${key}`;
      }

      // // Handling #include
      // // This needs to precede everything else since it's meant to be overwritten
      // // in case of collision
      // var include_object_re = /\{\{([ ]*#include)[ ]*(.*)\}\}/;
      // var include_keys = Object.keys(template).filter(function(key) {
      //   return include_object_re.test(key);
      // });

      // if (include_keys.length > 0) {
      //   // find the first key with #include
      //   fun = TRANSFORM.tokenize(include_keys[0]);
      //   if (fun.expression) {
      //     // if #include has arguments, evaluate it before attaching
      //     result = TRANSFORM.fillout(
      //       template[include_keys[0]],
      //       "{{" + fun.expression + "}}",
      //       true
      //     );
      //   } else {
      //     // no argument, simply attach the child
      //     result = template[include_keys[0]];
      //   }
      // }

      // for (var key in template) {
      //   // Checking to see if the key contains template..
      //   // Currently the only case for this are '#each' and '#include'
      //   if (Helper.is_template(key)) {
      //     fun = TRANSFORM.tokenize(key);
      //     if (fun) {
      //       if (fun.name === "#include") {
      //       } else if (fun.name === "#optional") {
      //         let ret = TRANSFORM.run(template[key], data);

      //         if (
      //           !ret ||
      //           ret == null ||
      //           ret == undefined ||
      //           (typeof ret === "object" && Object.keys(ret).length === 0) ||
      //           (Helper.is_array(ret) && ret.length === 0)
      //         ) {
      //           // We want to ignore these cases
      //         } else {
      //           result[fun.expression] = ret;
      //         }
      //       } else if (fun.name === "#flatten") {
      //         let arr = TRANSFORM.run(template[key], data);
      //         result = [];

      //         if (Helper.is_array(arr)) {
      //           // For each item in the array
      //           for (let i = 0; i < arr.length; i++) {
      //             // If array then flatten
      //             if (Helper.is_array(arr[i])) {
      //               for (let j = 0; j < arr[i].length; j++)
      //                 result.push(arr[i][j]);

      //               // Just push if anything else
      //             } else {
      //               result.push(arr[i]);
      //             }
      //           }
      //         }
      //       } else if (fun.name === "#let") {
      //         if (Helper.is_array(template[key]) && template[key].length == 2) {
      //           var defs = template[key][0];
      //           var real_template = template[key][1];

      //           // 1. Parse the first item to assign variables
      //           var parsed_keys = TRANSFORM.run(defs, data);

      //           // 2. modify the data
      //           let originals = {};
      //           let moriginals = {};
      //           for (var parsed_key in parsed_keys) {
      //             moriginals[parsed_key] = TRANSFORM.memory[parsed_key];
      //             TRANSFORM.memory[parsed_key] = parsed_keys[parsed_key];
      //             originals[parsed_key] = data[parsed_key];
      //             data[parsed_key] = parsed_keys[parsed_key];
      //           }

      //           // 3. Pass it into TRANSFORM.run
      //           result = TRANSFORM.run(real_template, data);

      //           // 4. Remove the data from memory
      //           for (var parsed_key in parsed_keys) {
      //             if (moriginals[parsed_key])
      //               TRANSFORM.memory[parsed_key] = moriginals[parsed_key];
      //             else delete TRANSFORM.memory[parsed_key];

      //             if (originals[parsed_key])
      //               data[parsed_key] = originals[parsed_key];
      //             else delete data[parsed_key];
      //           }

      //           ///////////////////////////
      //           /// End of modification ///
      //           ///////////////////////////
      //         }
      //       } else if (fun.name === "#concat") {
      //         if (Helper.is_array(template[key])) {
      //           result = [];
      //           template[key].forEach(function(concat_item) {
      //             var res = TRANSFORM.run(concat_item, data);
      //             result = result.concat(res);
      //           });

      //           if (/\{\{(.*?)\}\}/.test(JSON.stringify(result))) {
      //             // concat should only trigger if all of its children
      //             // have successfully parsed.
      //             // so check for any template expression in the end result
      //             // and if there is one, revert to the original template
      //             result = template;
      //           }
      //         }
      //       } else if (fun.name === "#merge") {
      //         if (Helper.is_array(template[key])) {
      //           result = {};
      //           template[key].forEach(function(merge_item) {
      //             var res = TRANSFORM.run(merge_item, data);
      //             for (var key in res) {
      //               result[key] = res[key];
      //             }
      //           });
      //           // clean up $index from the result
      //           // necessary because #merge merges multiple objects into one,
      //           // and one of them may be 'this', in which case the $index attribute
      //           // will have snuck into the final result
      //           if (typeof data === "object") {
      //             delete result["$index"];

      //             // #let handling
      //             for (var declared_vars in TRANSFORM.memory) {
      //               delete result[declared_vars];
      //             }
      //           } else {
      //             delete String.prototype.$index;
      //             delete Number.prototype.$index;
      //             delete Function.prototype.$index;
      //             delete Array.prototype.$index;
      //             delete Boolean.prototype.$index;

      //             // #let handling
      //             for (var declared_vars in TRANSFORM.memory) {
      //               delete String.prototype[declared_vars];
      //               delete Number.prototype[declared_vars];
      //               delete Function.prototype[declared_vars];
      //               delete Array.prototype[declared_vars];
      //               delete Boolean.prototype[declared_vars];
      //             }
      //           }
      //         }
      //       } else if (fun.name === "#each") {
      //         // newData will be filled with parsed results
      //         var newData = TRANSFORM.fillout(
      //           data,
      //           "{{" + fun.expression + "}}",
      //           true
      //         );

      //         // Ideally newData should be an array since it was prefixed by #each
      //         if (newData && Helper.is_array(newData)) {
      //           result = [];
      //           let originals = {}; // Modified by Jakub Mifek
      //           for (var index = 0; index < newData.length; index++) {
      //             // temporarily set $index and $this
      //             if (typeof newData[index] === "object") {
      //               newData[index]["$index"] = index;
      //               newData[index]["$this"] = newData[index];
      //               // #let handling

      //               for (var declared_vars in TRANSFORM.memory) {
      //                 originals[declared_vars] = newData[index][declared_vars]; // Modified by Jakub Mifek
      //                 newData[index][declared_vars] =
      //                   TRANSFORM.memory[declared_vars];
      //               }
      //             } else {
      //               String.prototype.$index = index;
      //               Number.prototype.$index = index;
      //               Function.prototype.$index = index;
      //               Array.prototype.$index = index;
      //               Boolean.prototype.$index = index;
      //               // #let handling
      //               for (var declared_vars in TRANSFORM.memory) {
      //                 String.prototype[declared_vars] =
      //                   TRANSFORM.memory[declared_vars];
      //                 Number.prototype[declared_vars] =
      //                   TRANSFORM.memory[declared_vars];
      //                 Function.prototype[declared_vars] =
      //                   TRANSFORM.memory[declared_vars];
      //                 Array.prototype[declared_vars] =
      //                   TRANSFORM.memory[declared_vars];
      //                 Boolean.prototype[declared_vars] =
      //                   TRANSFORM.memory[declared_vars];
      //               }
      //             }

      //             // run
      //             var loop_item = TRANSFORM.run(template[key], newData[index]);

      //             // clean up $index and $this
      //             if (typeof newData[index] === "object") {
      //               delete newData[index]["$index"];
      //               delete newData[index]["$this"];
      //               // #let handling
      //               for (var declared_vars in TRANSFORM.memory) {
      //                 // Modified by Jakub Mifek
      //                 if (originals[declared_vars])
      //                   newData[index][declared_vars] =
      //                     originals[declared_vars];
      //                 else delete newData[index][declared_vars];
      //               }
      //             } else {
      //               delete String.prototype.$index;
      //               delete Number.prototype.$index;
      //               delete Function.prototype.$index;
      //               delete Array.prototype.$index;
      //               delete Boolean.prototype.$index;
      //               // #let handling
      //               for (var declared_vars in TRANSFORM.memory) {
      //                 delete String.prototype[declared_vars];
      //                 delete Number.prototype[declared_vars];
      //                 delete Function.prototype[declared_vars];
      //                 delete Array.prototype[declared_vars];
      //                 delete Boolean.prototype[declared_vars];
      //               }
      //             }

      //             if (loop_item) {
      //               // only push when the result is not null
      //               // null could mean #if clauses where nothing matched => In this case instead of rendering 'null', should just skip it completely
      //               result.push(loop_item);
      //             }
      //           }
      //         } else {
      //           // In case it's not an array, it's an exception, since it was prefixed by #each.
      //           // This probably means this #each is not for the current variable
      //           // For example {{#each items}} may not be an array, but just leave it be, so
      //           // But don't get rid of it,
      //           // Instead, just leave it as template
      //           // So some other parse run could fill it in later.
      //           result = template;
      //         }
      //       } // end of #each
      //     } else {
      //       // end of if (fun)
      //       // If the key is a template expression but aren't either #include or #each,
      //       // it needs to be parsed
      //       var k = TRANSFORM.fillout(data, key);
      //       var v = TRANSFORM.fillout(data, template[key]);
      //       if (k !== undefined && v !== undefined) {
      //         result[k] = v;
      //       }
      //     }
      //   } else {
      //     // Helper.is_template(key) was false, which means the key was not a template (hardcoded string)
      //     if (typeof template[key] === "string") {
      //       fun = TRANSFORM.tokenize(template[key]);
      //       if (fun && fun.name === "#?") {
      //         // If the key is a template expression but aren't either #include or #each,
      //         // it needs to be parsed
      //         var filled = TRANSFORM.fillout(
      //           data,
      //           "{{" + fun.expression + "}}"
      //         );
      //         if (filled === "{{" + fun.expression + "}}" || !filled) {
      //           // case 1.
      //           // not parsed, which means the evaluation failed.
      //           // case 2.
      //           // returns fasly value
      //           // both cases mean this key should be excluded
      //         } else {
      //           // only include if the evaluation is truthy
      //           result[key] = filled;
      //         }
      //       } else {
      //         var item = TRANSFORM.run(template[key], data);
      //         if (item !== undefined) {
      //           result[key] = item;
      //         }
      //       }
      //     } else {
      //       var item = TRANSFORM.run(template[key], data);
      //       if (item !== undefined) {
      //         result[key] = item;
      //       }
      //     }
      //   }
      // }
    } else {
      return template;
    }
    return result;
  }
}

class Select {
  constructor(st) {
    this.st = st;
  }

  root() {
    this.$progress = null;
    return this.$selectedRoot;
  }

  values() {
    this.$progress = null;
    if (this.$selected)
      return this.$selected.map(item => {
        return item.value;
      });

    return Object.values(this.$selectedRoot);
  }

  paths() {
    this.$progress = null;
    if (this.$selected)
      return this.$selected.map(item => {
        return item.path;
      });

    if (Array.isArray(this.$selectedRoot))
      return Object.keys(this.$selectedRoot).map(item => {
        // key is integer
        return `[${item}]`;
      });

    return Object.keys(this.$selectedRoot).map(item => {
      // key is string
      return `[${item}]`;
    });
  }

  keys() {
    this.$progress = null;
    if (this.$selected)
      return this.$selected.map(item => {
        return item.key;
      });

    if (Array.isArray(this.$selectedRoot))
      return Object.keys(this.$selectedRoot).map(key => {
        return parseInt(key);
      });

    return Object.keys(this.$selectedRoot);
  }

  objects() {
    this.$progress = null;
    if (this.$selected)
      return this.$selected.map(item => {
        return item.object;
      });

    return [this.$selectedRoot];
  }

  transform(obj, serialized) {
    this.$parsed = [];
    this.$progress = null;
    /*
      'selected' is an array that contains items that looks like this:
          {
            key: The selected key,
            path: The path leading down to the selected key,
            object: The entire object that contains the currently selected key/val pair
            value: The selected value
          }
    */
    let data = obj;
    try {
      if (serialized) data = JSON.parse(obj);
    } catch (error) {}

    // since we're assuming that the template has been already selected, the $template_root is $selected_root
    this.$templateRoot = this.$selectedRoot;

    String.prototype.$root = data;
    Number.prototype.$root = data;
    Function.prototype.$root = data;
    Array.prototype.$root = data;
    Boolean.prototype.$root = data;

    if (this.$selected && this.$selected.length > 0) {
      this.$selected
        .sort((a, b) => {
          // sort by path length, so that deeper level items will be replaced first
          // TODO: may need to look into edge cases
          return b.path.length - a.path.length;
        })
        .forEach(selection => {
          // parse selected
          const parsedObject = new Transform(this, this.st).run(
            selection.object,
            data
          );
          // apply the result to root
          this.$templateRoot = Helper.resolve(
            this.$templateRoot,
            selection.path,
            parsedObject
          );
          this.$selectedRoot = this.$templateRoot;

          // update selected object with the parsed result
          selection.object = parsedObject;
        });
      this.$selected.sort((a, b) => {
        return a.index - b.index;
      });
    } else {
      const parsed_object = new Transform(this, this.st).run(
        this.$selectedRoot,
        data
      );
      // apply the result to root
      this.$templateRoot = Helper.resolve(
        this.$templateRoot,
        "",
        parsed_object
      );
      this.$selectedRoot = this.$templateRoot;
    }
    delete String.prototype.$root;
    delete Number.prototype.$root;
    delete Function.prototype.$root;
    delete Array.prototype.$root;
    delete Boolean.prototype.$root;
    return this;
  }

  transformWith(obj, serialized) {
    this.$parsed = [];
    this.$progress = null;
    /*
     *  'selected' is an array that contains items that looks like this:
     *  {
     *    key: The selected key,
     *    path: The path leading down to the selected key,
     *    object: The entire object that contains the currently selected key/val pair
     *    value: The selected value
     *  }
     */
    let template = obj;
    try {
      if (serialized) template = JSON.parse(obj);
    } catch (error) {}

    // Setting $root
    this.$templateRoot = template;
    String.prototype.$root = this.$selectedRoot;
    Number.prototype.$root = this.$selectedRoot;
    Function.prototype.$root = this.$selectedRoot;
    Array.prototype.$root = this.$selectedRoot;
    Boolean.prototype.$root = this.$selectedRoot;
    root = this.$selectedRoot;
    // generate new $selected_root
    if (this.$selected && this.$selected.length > 0) {
      this.$selected
        .sort((a, b) => {
          // sort by path length, so that deeper level items will be replaced first
          // TODO: may need to look into edge cases
          return b.path.length - a.path.length;
        })
        .forEach(selection => {
          //SELECT.$selected.forEach(function(selection) {
          // parse selected
          const parsed_object = new Transform(this, this.st).run(
            template,
            selection.object
          );

          // apply the result to root
          this.$selectedRoot = Helper.resolve(
            this.$selectedRoot,
            selection.path,
            parsed_object
          );

          // update selected object with the parsed result
          selection.object = parsed_object;
        });
      this.$selected.sort((a, b) => {
        return a.index - b.index;
      });
    } else {
      const parsed_object = new Transform(this, this.st).run(
        template,
        this.$selectedRoot
      );
      // apply the result to root
      this.$selectedRoot = Helper.resolve(
        this.$selectedRoot,
        "",
        parsed_object
      );
    }
    delete String.prototype.$root;
    delete Number.prototype.$root;
    delete Function.prototype.$root;
    delete Array.prototype.$root;
    delete Boolean.prototype.$root;
    return this;
  }

  inject(obj, serialized) {
    this.$injected = obj;
    try {
      if (serialized) this.$injected = JSON.parse(obj);
    } catch (error) {}

    if (Object.keys(this.$injected).length > 0) {
      this.select(this.$injected);
    }
    return this;
  }

  exec(current, path, filter) {
    // if current matches the pattern, put it in the selected array
    if (typeof current === "string")
      // leaf node should be ignored
      // we're lookin for keys only
      return;

    if (Helper.is_array(current)) {
      for (var i = 0; i < current.length; i++) {
        this.exec(current[i], `${path}[${i}]`, filter);
      }
      return;
    }

    // object
    for (const key in current) {
      // '$root' is a special key that links to the root node
      // so shouldn't be used to iterate
      if (key !== "$root") {
        if (filter(key, current[key])) {
          const index = SELECT.$selected.length;
          this.$selected.push({
            index: index,
            key: key,
            path: path,
            object: current,
            value: current[key]
          });
        }
        this.exec(current[key], `${path}["${key}"]`, filter);
      }
    }
  }

  select(obj, filter, serialized) {
    // iterate '$selected'
    //
    /*
        SELECT.$selected = [{
            value {
                '{{#include}}': {
                    '{{#each items}}': {
                        'type': 'label',
                        'text': '{{name}}'
                    }
                }
            },
            path: '$jason.head.actions.$load'
            ...
        }]
    */
    let json = obj;
    try {
      if (serialized) json = JSON.parse(obj);
    } catch (error) {}

    if (filter) {
      this.$selected = [];
      this.exec(json, "", filter);
    } else {
      this.$selected = null;
    }

    if (json && (Helper.is_array(json) || typeof json === "object")) {
      if (!this.$progress) {
        // initialize
        if (Helper.is_array(json)) {
          this.$val = [];
          this.$selectedRoot = [];
        } else {
          this.$val = {};
          this.$selectedRoot = {};
        }
      }
      for(const key in json) {
        this.$val[key] = json[key];
        this.$selectedRoot[key] = json[key];
      }
    } else {
      this.$val = json;
      this.$selectedRoot = json;
    }
    this.$progress = true; // set the 'in progress' flag

    return this;
  }
}

/**
 * Select-Transform class
 */
module.exports.ST = class ST {
  
  constructor() {
    this.templates = {};
  }

  /**
   * Adds subtemplates that should be used into the class.
   * If a template with same name is already present, it will be overriden by this method.
   *
   * @param {object} subtemplates Provided subtemplates
   */
  addTemplates(subtemplates) {
    Object.assign(this.templates, subtemplates);

    return this;
  }

  /**
   * Clears template library.
   */
  clearTemplates() {
    this.templates = {};

    return this;
  }

  async transform(asyncLayers, template, data, serialized) {}

  transformSync(template, data, serialized) {
    // no need for separate template resolution step
    // select the template with selector and transform data
    const res = new Select(this)
      .select(template, undefined, serialized)
      .transform(data, serialized)
      .root();
    if (serialized)
      // needs to return stringified version
      return JSON.stringify(res);

    return res;
  }

  select(template, selector, serialized) {
    const res = new Select(this).select(template, selector, serialized).root();
    
    if (serialized)
      // needs to return stringified version
      return JSON.stringify(res);

    return res;
  }
}























// (function() {
//   var $context = this;
//   var root; // root context
//   var Helper = {
//     is_template: function(str) {},
//     is_array: function(item) {},
//     resolve: function(o, path, new_val) {}
//   };
//   var Conditional = {
//     run: function(template, data) {},
//     is: function(template) {}
//   };
//   var TRANSFORM = {
//     memory: {},
//     templates: {}, // Modified by Jakub Mifek
//     transform: function(template, data, injection, serialized) {},
//     tokenize: function(str) {},
//     run: function(template, data) {},
//     fillout: function(data, template, raw) {},
//     _fillout: function(options) {}
//   };
//   var SELECT = {
//     // current: currently accessed object
//     // path: the path leading to this item
//     // filter: The filter function to decide whether to select or not
//     $val: null,
//     $selected: [],
//     $injected: [],
//     $progress: null,
//     exec: function(current, path, filter) {},
//     inject: function(obj, serialized) {},
//     // returns the object itself
//     select: function(obj, filter, serialized) {},
//     transformWith: function(obj, serialized) {},
//     transform: function(obj, serialized) {},

//     // Terminal methods
//     objects: function() {},
//     keys: function() {},
//     paths: function() {},
//     values: function() {},
//     root: function() {}
//   };

//   // Native JSON object override
//   var _stringify = JSON.stringify;
//   JSON.stringify = function(val, replacer, spaces) {
//     var t = typeof val;
//     if (["number", "string", "boolean"].indexOf(t) !== -1) {
//       return _stringify(val, replacer, spaces);
//     }
//     if (!replacer) {
//       return _stringify(
//         val,
//         function(key, val) {
//           if (
//             SELECT.$injected &&
//             SELECT.$injected.length > 0 &&
//             SELECT.$injected.indexOf(key) !== -1
//           ) {
//             return undefined;
//           }
//           if (key === "$root" || key === "$index") {
//             return undefined;
//           }
//           if (key in TRANSFORM.memory) {
//             return undefined;
//           }
//           if (typeof val === "function") {
//             return "(" + val.toString() + ")";
//           } else {
//             return val;
//           }
//         },
//         spaces
//       );
//     } else {
//       return _stringify(val, replacer, spaces);
//     }
//   };

//   var setTemplates = function(templates) {};

//   // Export
//   if (typeof exports !== "undefined") {
//     var x = {
//       TRANSFORM: TRANSFORM,
//       SELECT: SELECT,
//       Conditional: Conditional,
//       Helper: Helper,
//       inject: SELECT.inject,
//       select: SELECT.select,
//       transform: TRANSFORM.transform,
//       setTemplates: setTemplates // Modified by Jakub Mifek
//     };
//     if (typeof module !== "undefined" && module.exports) {
//       exports = module.exports = x;
//     }
//     exports = x;
//   } else {
//     $context.ST = {
//       select: SELECT.select,
//       inject: SELECT.inject,
//       transform: TRANSFORM.transform,
//       setTemplates: setTemplates // Modified by Jakub Mifek
//     };
//   }
// })();