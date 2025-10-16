import React, { Component } from "react";
import Header from './Header';
import Footer from './Footer';

interface AppState {
    isLoggedIn: boolean;
}

class App extends Component<{}, AppState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            isLoggedIn: false,
        };
    }
    handleLogin = () => {
        this.setState({ isLoggedIn: true });
    };

    render() {
        return (
            <>
                <Header />
                <main style={{ textAlign: "center" }}>
                    <h2>Welcome to the Student Life Hub</h2>
                    {!this.state.isLoggedIn ? (
                        <button onClick={this.handleLogin}>Log In</button>
                    ) : (
                        <p>You're logged in!</p>
                    )}
                </main>
                <Footer />
            </>
        );
    }
}

export default App;
