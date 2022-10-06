import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Session } from '../session-store';

export const setAuthToken = (token: string) => {
    Session.setPersistent({ "token": token });
    if (Session.get("token") !== token) {
        console.log("Error saving token to session")
        return false;
    }
    return true;
}

export const getAuthToken = () => {
    const token = Session.get("token");
    if (!token || token === "") {
        return null;
    }
    const exp = JSON.parse(atob(token.split(".")[1])).exp;
    if (token && token !== "" && exp > Math.floor(Date.now() / 1000)) {
        return token;
    }
    else return null;
}

export function useAuthMandatoryLogin(redirectFrom: string): [string | null, boolean, () => void] {
    const [token, setToken] = useState(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const history = useHistory();

    useEffect(() => {
        const token = getAuthToken();

        if (!token || token === "") {
            signIn(redirectFrom)
        }

        setToken(token);
        setIsAuthenticating(false);
    });

    const signIn = (redirectFrom: string) => {
        Session.setPersistent({ "redirectFrom": redirectFrom });
        history.push("/login");
    }

    const signOut = () => {
        Session.set("token", null);
        history.push("/");
    }

    return [token, isAuthenticating, signOut];
}

export function useAuthOptionalLogin(): [string | null, (redirectFrom: string) => void, () => void] {
    const [token, setToken] = useState(null);
    const history = useHistory();

    useEffect(() => {
        const token = getAuthToken();

        if (token || token !== "") {
            setToken(token);
        }
    });

    const signIn = (redirectFrom: string) => {
        Session.setPersistent({ "redirectFrom": redirectFrom });
        history.push("/login");
    }

    const signOut = () => {
        Session.set("token", null);
        history.push("/");
    }

    return [token, signIn, signOut];
}