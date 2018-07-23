import React from "react";
import ReactDOM from "react-dom";
import { DrizzleProvider } from 'drizzle-react';
import App from './App.jsx';
import store from './store';
import { drizzleOptions } from './store';

class Root extends React.Component {
    render() {
        return (
            <DrizzleProvider options={drizzleOptions} store={store} >
                <App />
            </DrizzleProvider>
        )
    }
}


let rootElement = document.getElementById("root");

ReactDOM.render(<Root />, rootElement);
