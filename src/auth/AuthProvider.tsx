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
    const setSessionSignedIn = useSessionUser((state) => state.setSessionSignedIn)
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
        if (user) setUser(user)
    }

    const handleSignOut = () => {
        setToken('')
        setUser({})
        setSessionSignedIn(false)
    }

    const signIn = async (values: SignInCredential): AuthResult => {
        try {
            const resp: any = await signInWithEmailAndPassword(auth, values.username, values.password)
            if (!resp) return { status: 'failed', message: 'Unable to sign in' }

            const firebaseUser = resp.user

            // 1. تحقق من الإيميل
            if (!firebaseUser.emailVerified) {
                return { status: 'failed', message: 'email_not_verified' }
            }

            let role = 'patient'
            let displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'

            // 2. شوف في doctors الأول
            const doctorDoc = await getDoc(doc(db, 'doctors', firebaseUser.uid))

            if (doctorDoc.exists()) {
                const data = doctorDoc.data()
                displayName = data.name || displayName

                if (data.role === 'doctor') {
                    // ✅ أدمن وافق عليه
                    role = 'doctor'
                } else {
                    // role == 'pending' → لسه تحت المراجعة
                    return { status: 'failed', message: 'account_pending_approval' }
                }

            } else {
                // 3. مش في doctors → شوف في users
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

                if (userDoc.exists()) {
                    const data = userDoc.data()
                    displayName = data.name || data.displayName || displayName
                    role = data.role === 'admin' ? 'admin' : 'patient'
                } else {
                    return { status: 'failed', message: 'Unable to find account' }
                }
            }

            // 4. بناء الـ user object
            const authedUser: User = {
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                userName: displayName,
                avatar: firebaseUser.photoURL || null,
                authority: [role],
            }

            handleSignIn({ accessToken: firebaseUser.stsTokenManager.accessToken }, authedUser)

            // 5. رجّع الـ authority في الـ result عشان Login.tsx يعمل redirect صح
            return {
    status: 'success',
    message: '',
    ...(({ authority: [role] }) as any),
} as any

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
                return { status: 'success', message: '' }
            }
            return { status: 'failed', message: 'Unable to sign up' }
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

    const oAuthSignIn = (callback: (payload: OauthSignInCallbackPayload) => void) => {
        callback({ onSignIn: handleSignIn, redirect })
    }

    return (
        <AuthContext.Provider value={{ authenticated, user, signIn, signUp, signOut, oAuthSignIn }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider
