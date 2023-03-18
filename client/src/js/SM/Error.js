Ext.ns('SM.Error')

class NonError extends Error {
  name = 'NonError';

  constructor(message) {
    super(NonError._prepareSuperMessage(message));
  }

  static _prepareSuperMessage(message) {
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}

class SmError extends Error {
  constructor({message}) {
    super(message)
    this.name = this.constructor.name
    this.env = STIGMAN.Env
    this.stack = this.stack
    // this.toJSON = () => { 
    //   const { name, message, stack } = this
    //   return { name, message, stack, ...this }
    // }
  }
}

class PrivilegeError extends SmError {
  constructor(detail) {
    super('User has insufficient privilege to complete this request.')
    this.status = 403
    this.detail = detail
  }
}

class ClientError extends SmError {
  constructor(detail) {
    super({message:'Incorrect request.'})
    // this.message = 'Inc request'
    this.detail = detail
  }
}
class ExtRequestError extends SmError {
  constructor(detail) {
    super({message:'Ext.Ajax.requestPromise() failed'})
    // this.message = 'Inc request'
    this.detail = detail
  }
}

class NotFoundError extends SmError {
  constructor(detail) {
    super('Resource not found.')
    this.status = 404
    this.detail = detail
  }
}

class UnprocessableError extends SmError {
  constructor(detail) {
    super('Unprocessable Entity.')
    this.status = 422
    this.detail = detail
  }
}

class InternalError extends SmError {
  constructor(error) {
    super(error.message)
    this.detail = { error }
  }
}

Object.assign(SM.Error, {
  SmError,
  PrivilegeError,
  NotFoundError,
  ClientError,
  ExtRequestError,
  UnprocessableError,
  InternalError 
})


// serialize-error follows

const list = [
  // Native ES errors https://262.ecma-international.org/12.0/#sec-well-known-intrinsic-objects
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError,

  // Built-in errors
  globalThis.DOMException,

  // Node-specific errors
  // https://nodejs.org/api/errors.html
  globalThis.AssertionError,
  globalThis.SystemError,
]
  // Non-native Errors are used with `globalThis` because they might be missing. This filter drops them when undefined.
  .filter(Boolean)
  .map(
    constructor => [constructor.name, constructor],
  );

const errorConstructors = new Map(list);


const commonProperties = [
  {
    property: 'name',
    enumerable: false,
  },
  {
    property: 'message',
    enumerable: false,
  },
  {
    property: 'stack',
    enumerable: false,
  },
  {
    property: 'code',
    enumerable: true,
  },
  {
    property: 'cause',
    enumerable: false,
  },
];

const toJsonWasCalled = Symbol('.toJSON was called');

const toJSON = from => {
  from[toJsonWasCalled] = true;
  const json = from.toJSON();
  delete from[toJsonWasCalled];
  return json;
};

const getErrorConstructor = name => errorConstructors.get(name) ?? Error;

// eslint-disable-next-line complexity
const destroyCircular = ({
  from,
  seen,
  to,
  forceEnumerable,
  maxDepth,
  depth,
  useToJSON,
  serialize,
}) => {
  if (!to) {
    if (Array.isArray(from)) {
      to = [];
    } else if (!serialize && isErrorLike(from)) {
      const Error = getErrorConstructor(from.name);
      to = new Error();
    } else {
      to = {};
    }
  }

  seen.push(from);

  if (depth >= maxDepth) {
    return to;
  }

  if (useToJSON && typeof from.toJSON === 'function' && from[toJsonWasCalled] !== true) {
    return toJSON(from);
  }

  const continueDestroyCircular = value => destroyCircular({
    from: value,
    seen: [...seen],
    forceEnumerable,
    maxDepth,
    depth,
    useToJSON,
    serialize,
  });

  for (const [key, value] of Object.entries(from)) {
    // eslint-disable-next-line node/prefer-global/buffer
    if (typeof Buffer === 'function' && Buffer.isBuffer(value)) {
      to[key] = '[object Buffer]';
      continue;
    }

    // TODO: Use `stream.isReadable()` when targeting Node.js 18.
    if (value !== null && typeof value === 'object' && typeof value.pipe === 'function') {
      to[key] = '[object Stream]';
      continue;
    }

    if (typeof value === 'function') {
      continue;
    }

    if (!value || typeof value !== 'object') {
      to[key] = value;
      continue;
    }

    if (!seen.includes(from[key])) {
      depth++;
      to[key] = continueDestroyCircular(from[key]);

      continue;
    }

    to[key] = '[Circular]';
  }

  for (const { property, enumerable } of commonProperties) {
    if (typeof from[property] !== 'undefined' && from[property] !== null) {
      Object.defineProperty(to, property, {
        value: isErrorLike(from[property]) ? continueDestroyCircular(from[property]) : from[property],
        enumerable: forceEnumerable ? true : enumerable,
        configurable: true,
        writable: true,
      });
    }
  }

  return to;
};

SM.Error.serializeError = function serializeError(value, options = {}) {
  const {
    maxDepth = Number.POSITIVE_INFINITY,
    useToJSON = true,
  } = options;

  if (typeof value === 'object' && value !== null) {
    return destroyCircular({
      from: value,
      seen: [],
      forceEnumerable: true,
      maxDepth,
      depth: 0,
      useToJSON,
      serialize: true,
    });
  }

  // People sometimes throw things besides Error objects…
  if (typeof value === 'function') {
    // `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
    return `[Function: ${value.name ?? 'anonymous'}]`;
  }

  return value;
}

SM.Error.deserializeError = function deserializeError(value, options = {}) {
  const { maxDepth = Number.POSITIVE_INFINITY } = options;

  if (value instanceof Error) {
    return value;
  }

  if (isMinimumViableSerializedError(value)) {
    const Error = getErrorConstructor(value.name);
    return destroyCircular({
      from: value,
      seen: [],
      to: new Error(),
      maxDepth,
      depth: 0,
      serialize: false,
    });
  }

  return new NonError(value);
}

function isErrorLike(value) {
  return Boolean(value)
    && typeof value === 'object'
    && 'name' in value
    && 'message' in value
    && 'stack' in value;
}

function isMinimumViableSerializedError(value) {
  return Boolean(value)
    && typeof value === 'object'
    && 'message' in value
    && !Array.isArray(value);
}

// not serialize-error

SM.Error.FormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this

    this.displayField = new Ext.form.DisplayField({
      fieldLabel: 'Message',
      value: 'display field text',
      height: 50
    })
  

    this.jsonViewDisplayField = new Ext.form.DisplayField({
      allowBlank: true,
      style: 'border: 1px solid #C1C1C1',
      fieldLabel: 'Detail',
      autoScroll: true,
      border: true,
      name: 'errorObj',
      // height: 150,
      anchor: '100% -80',
      setValue: function (v) {
          if (Object.keys(v).length === 0 && v.constructor === Object) {
              return
          }
          const tree = JsonView.createTree(v)
          tree.key = 'error'
          tree.isExpanded = true
          tree.children[0].isExpanded = true
          const el = this.getEl().dom
          JsonView.render(tree, el)
          // JsonView.expandChildren(tree)
          this.value = v
      }
    })
    
    const config = {
      border: false,
      labelWidth: 65,
      items: [
        this.displayField,
        this.jsonViewDisplayField
      ],
      buttons: [{
        text: 'Copy',
        handler: async function (btn) {
          await navigator.clipboard.writeText(JSON.stringify(_this.jsonViewDisplayField.value))
        }
      }]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Error.displayError = function (data) {
  const fp = new SM.Error.FormPanel()
  const appwindow = new Ext.Window({
    title: 'Unhandled Error',
    cls: 'sm-dialog-window sm-round-panel',
    modal: true,
    hidden: true,
    width: 660,
    height: 650,
    layout: 'fit',
    plain:true,
    bodyStyle:'padding:15px;',
    buttonAlign:'right',
    items: fp
  })
  appwindow.render(document.body)
  fp.getForm().setValues(data)
  appwindow.show(document.body)
}


SM.Error.handleError = async function (e) {
  try {
    if (SM.isMinimizedSource && !SM.Error.sourceMapConsumer) {
      await SM.Error.initSourceMap()
    }
    let errorObj
    if (e instanceof Error) {
      if (SM.isMinimizedSource) {
        e.sourceStack = SM.Error.getOriginalSource(e.stack)
      }
      // errorObj = SM.Error.serializeError(e.error ? e.error : e)
      errorObj = e.error ? e.error : e
    }
    else {
      errorObj = e
    }
    SM.Error.displayError({errorObj})
  }
  catch (e) {
    alert(e.message ?? 'error in SM.Error.handleError()!')
  }
}

SM.Error.initSourceMap = async function () {
  try {
    sourceMap.SourceMapConsumer.initialize({
      "lib/mappings.wasm": "js/modules/mappings.wasm"
    })
    const response = await fetch ('js/stig-manager.min.js.map')
    const text = await response.text()
    SM.Error.sourceMapConsumer = await new sourceMap.SourceMapConsumer(JSON.parse(text))

  }
  catch (e) {
    SM.Error.handleError(e)
  }

}

SM.Error.getOriginalSource = function (stackTrace) {
  let output = ''
  const stack = SM.StackTrace.parse(stackTrace)
  stack.forEach(({ methodName, lineNumber, column }) => {
    try {
      if (lineNumber == null || lineNumber < 1) {
        output += `    at ${methodName || ''}\n`
      } else {
        const pos = SM.Error.sourceMapConsumer.originalPositionFor({ line: lineNumber, column });
        if (pos && pos.line != null) {
          output += `    at ${pos.name || ''} (${pos.source}:${pos.line}:${pos.column})\n`
        }
      }
    } catch (err) {
      output += `    at FAILED_TO_PARSE_LINE\n`
    }
  })
  return output
}