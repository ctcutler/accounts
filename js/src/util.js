var fp = require('lodash/fp');
var _ = require('lodash');
var splitOnce = c => s =>
  [ s.substring(0, s.indexOf(c)), s.substring(s.indexOf(c)+1) ];

const includes = c => s => s.includes(c);

const fpSplitN = (splitter, canSplit, maxSplits, s) =>
  maxSplits > 0 && canSplit(s)
    ? _.reduce(
        splitter(s),
        (acc, val, i) =>
          _.concat(
            acc,
            i === 0 ? val : fpSplitN(splitter, canSplit, maxSplits-1, val)
          ),
        []
      )
    : s;

export const splitN = (splitOn, maxSplits, s) =>
  fpSplitN(
    splitOnce(splitOn),
    includes(splitOn),
    maxSplits,
    s
  );
