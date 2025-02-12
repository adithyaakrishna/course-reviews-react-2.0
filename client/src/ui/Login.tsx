import React from 'react';
import CUreviewsGoogleLogin from './CUreviewsGoogleLogin';
import "./css/Login.css";

/**
 * Redirects a user to the login page.
 */
export default function Login() {
  return (
    <CUreviewsGoogleLogin
      executeLogin={true}
      waitTime={0} />
  )
}
