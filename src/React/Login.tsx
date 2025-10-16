import React, { Component, ChangeEvent, FormEvent } from "react";
import { Student } from "./model/Student";



interface LoginProps {
    onLoginSuccess: (user: Student) => void;
}


interface LoginState {
    email: string;
    password: string;
    error: string;
}

class Login extends Component<LoginProps, LoginState> {
    constructor(props: LoginProps) {
        super(props);
        this.state = {
            email: "",
            password: "",
            error: "",
        };





    }
}


