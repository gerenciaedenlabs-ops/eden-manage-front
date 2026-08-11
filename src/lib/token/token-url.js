import { jwtDecode } from "jwt-decode";

async function isTokenValid(token) {
    let msg = 'Token valido'
    let decoded = {};
    try {
        decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            decoded = {}
            msg = 'El token ha expirado';
            return { decoded, msg };
        }
        return { decoded, msg };
    } catch {
        msg = 'Token invalido';
        return { decoded, msg };
    }
}

export default async function getTokenDecoded(token) {
    if (!token) {
        return false;
    }
    const { decoded, msg } = await isTokenValid(token);
    if (msg != 'Token valido' && Object.keys(decoded).length == 0) {
        return { decoded, msg };
    }
    return { decoded, msg };
}