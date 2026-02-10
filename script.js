import App from './src/App.js';

document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App, null));
});