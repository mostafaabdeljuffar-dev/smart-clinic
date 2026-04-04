import { useRef, useState } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import { apiSignOut, apiSignUp } from '@/services/AuthService'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    OauthSignInCallbackPayload,
    User,
    Token,
} from '@/@types/auth'
import type { ReactNode } from 'react'
import type { NavigateFunction } from 'react-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from "@/firebase"
import { doc, getDoc } from 'firebase/firestore'

type AuthProviderProps = { children: ReactNode }

export type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

function AuthProvider({ children }: AuthProviderProps) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const setSessionSignedIn = useSessionUser(
        (state) => state.setSessionSignedIn,
    )
    const { token, setToken } = useToken()
    const [tokenState, setTokenState] = useState(token)

    const authenticated = Boolean(tokenState && signedIn)

    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)
        navigatorRef.current?.navigate(
            redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath,
        )
    }

    const handleSignIn = (tokens: Token, user?: User) => {
        setToken(tokens.accessToken)
        setTokenState(tokens.accessToken)
        setSessionSignedIn(true)
        if (user) {
            setUser(user)
        }
    }

    const handleSignOut = () => {
        setToken('')
        setUser({})
        setSessionSignedIn(false)
    }

    const signIn = async (values: SignInCredential): AuthResult => {
        try {
            const resp: any = await signInWithEmailAndPassword(auth, values.username, values.password)
            if (resp) {
                const firebaseUser = resp.user

                // ── Check email verified ──────────────────────────────────
                if (!firebaseUser.emailVerified) {
                    return {
                        status: 'failed',
                        message: 'email_not_verified',
                    }
                }

                // ── Fetch role from Firestore users collection ────────────
                let role = 'user'
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
                    if (userDoc.exists()) {
                        role = userDoc.data().role ?? 'user'
                    }
                } catch {
                    // keep default role = 'user'
                }

                const user: User = {
                    userId: firebaseUser.uid,
                    email: firebaseUser.email,
                    userName: firebaseUser.email?.split('@')[0] || firebaseUser.displayName || 'User',
                    avatar: firebaseUser.photoURL || null,
                    authority: [role],
                }

                handleSignIn({ accessToken: firebaseUser.stsTokenManager.accessToken }, user)
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to sign in',
            }
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const signUp = async (values: SignUpCredential): AuthResult => {
        try {
            const resp = await apiSignUp(values)
            if (resp) {
                handleSignIn({ accessToken: resp.token }, resp.user)
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to sign up',
            }
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const signOut = async () => {
        try {
            await apiSignOut()
        } finally {
            handleSignOut()
            navigatorRef.current?.navigate('/')
        }
    }

    const oAuthSignIn = (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => {
        callback({
            onSignIn: handleSignIn,
            redirect,
        })
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signUp,
                signOut,
                oAuthSignIn,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider
