export const apiPrefix = ''

const endpointConfig = {
    signIn: '/sign-in',
    signOut: '/api/auth/logout',
    signUp: '/api/auth/register',
    verifyAccount: '/api/auth/verifyAccount',
    resendOTP: '/api/auth/resend-otp',
    forgotPassword: '/api/auth/forgot-password',
    verifyForgotPassword: '/api/auth/verify-forgot-password-otp',
    resetPassword: '/api/auth/reset-password',
    refreshToken: '/api/auth/refresh',
}

export default endpointConfig
