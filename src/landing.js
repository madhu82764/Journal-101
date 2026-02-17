import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from "jwt-decode"
import {useNavigate} from "react-router-dom"

export function Landing() {

const navigate = useNavigate()

function handleLogout() {
    googleLogout()
}

    return (
        <>
        <GoogleLogin onSuccess={(credentialResponse) => console.log(credentialResponse)} 
        onError ={()=> console.log("Login Failed")}/>
        auto_select = {true}
        </>
    )
}