
import React from "react";


class Footer extends React.Component {
    render() {
        return(
            <footer>
                <p>&copy; {new Date().getFullYear()} Your website name</p>
            </footer>
        );

    }
}

export default Footer