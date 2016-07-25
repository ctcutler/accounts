var React = require('react');
var ReactDOM = require('react-dom');

const addOne = x => x + 1;

const answer = addOne(2701);

ReactDOM.render(
  <h1>Hello, world {answer}!</h1>,
  document.getElementById('example')
);
