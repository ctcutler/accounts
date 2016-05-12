var _ = require('lodash');
var fp = require('lodash/fp');

export function parseTransaction(input) {
  console.log(input);
  console.log(_.split(input, '\n'));
  console.log(fp.flow(fp.split('\n'))(input));
  return {};
}
