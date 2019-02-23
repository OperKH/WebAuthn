export const coerceToArrayBuffer = (inputBuf, name) => {
  let buf = inputBuf;
  if (typeof buf === 'string') {
    // base64url to base64
    buf = buf.replace(/-/g, '+').replace(/_/g, '/');
    // base64 to Buffer
    buf = Buffer.from(buf, 'base64');
  }

  if (buf instanceof Buffer || Array.isArray(buf)) {
    buf = new Uint8Array(buf);
  }

  if (buf instanceof Uint8Array) {
    buf = buf.buffer;
  }

  if (!(buf instanceof ArrayBuffer)) {
    throw new TypeError(`could not coerce '${name}' to ArrayBuffer`);
  }

  return buf;
};

export const coerceToBase64 = (inputThing, name) => {
  let thing = inputThing;
  // Array to Uint8Array
  if (Array.isArray(thing)) {
    thing = Uint8Array.from(thing);
  }

  // Uint8Array, etc. to ArrayBuffer
  if (thing.buffer instanceof ArrayBuffer && !(thing instanceof Buffer)) {
    thing = thing.buffer;
  }

  // ArrayBuffer to Buffer
  if (thing instanceof ArrayBuffer && !(thing instanceof Buffer)) {
    thing = Buffer.from(thing);
  }

  // Buffer to base64 string
  if (thing instanceof Buffer) {
    thing = thing.toString('base64');
  }

  if (typeof thing !== 'string') {
    throw new Error(`couldn't coerce '${name}' to string`);
  }

  // base64 to base64url
  // NOTE: "=" at the end of challenge is optional, strip it off here so that it's compatible with client
  thing = thing
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=*$/g, '');

  return thing;
};
