import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();


const accessSecret: jwt.Secret = process.env.JWT_ACCESS_SECRET || '';
const refreshSecret: jwt.Secret = process.env.JWT_REFRESH_SECRET || '';
const accessExpires: jwt.SignOptions['expiresIn'] = process.env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] 
const refreshExpires: jwt.SignOptions['expiresIn'] = (process.env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'])


if (!accessSecret || !refreshSecret) {
throw new Error('JWT secrets not configured in env');
}


export function signAccessToken(payload: object) {
return jwt.sign(payload, accessSecret, { expiresIn: accessExpires });
}


export function signRefreshToken(payload: object) {
return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpires });
}


export function verifyAccessToken(token: string) {
return jwt.verify(token, accessSecret);
}


export function verifyRefreshToken(token: string) {
return jwt.verify(token, refreshSecret);
}