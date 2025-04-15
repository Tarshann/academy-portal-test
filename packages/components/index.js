// Components package entry point
const React = require('react');

// Button component
const Button = props => {
  return React.createElement('button', {
    ...props,
    className: `button ${props.className || ''}`
  }, props.children);
};

// NotificationHandler component
const NotificationHandler = props => {
  return React.createElement('div', {
    ...props,
    className: `notification ${props.type || 'info'} ${props.className || ''}`
  }, props.children);
};

module.exports = {
  Button,
  NotificationHandler
}; 