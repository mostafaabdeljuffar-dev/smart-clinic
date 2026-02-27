import cookiesStorage from '@/utils/cookiesStorage'
import appConfig from '@/configs/app.config'
import { REFRESH_TOKEN_NAME_IN_STORAGE, TOKEN_NAME_IN_STORAGE, VERIFICATION_TOKEN_NAME_IN_STORAGE } from '@/constants/api.constant'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/@types/auth'

type Session = {
    signedIn: boolean
}

type AuthState = {
    session: Session
    user: User
}

type AuthAction = {
    setSessionSignedIn: (payload: boolean) => void
    setUser: (payload: User) => void
}

const getPersistStorage = () => {
    if (appConfig.accessTokenPersistStrategy === 'localStorage') {
        return localStorage
    }

    if (appConfig.accessTokenPersistStrategy === 'sessionStorage') {
        return sessionStorage
    }

    return cookiesStorage
}

const initialState: AuthState = {
    session: {
        signedIn: false,
    },
    user: {
        avatar: '',
        userName: '',
        email: '',
        authority: [],
    },
}

export const useSessionUser = create<AuthState & AuthAction>()(
    persist(
        (set) => ({
            ...initialState,
            setSessionSignedIn: (payload) =>
                set((state) => ({
                    session: {
                        ...state.session,
                        signedIn: payload,
                    },
                })),
            setUser: (payload) =>
                set((state) => ({
                    user: {
                        ...state.user,
                        ...payload,
                    },
                })),
        }),
        { name: 'sessionUser', storage: createJSONStorage(() => localStorage) },
    ),
)

export const useToken = () => {
    const storage = getPersistStorage()

    const setToken = (token: string) => {
        storage.setItem(TOKEN_NAME_IN_STORAGE, token)
    }

    const setVerificationToken = (verificationToken: string) => {
        storage.setItem(VERIFICATION_TOKEN_NAME_IN_STORAGE, verificationToken)
    }
    
    const setRefreshToken = (refreshToken: string) => {
        storage.setItem(REFRESH_TOKEN_NAME_IN_STORAGE, refreshToken)
    }

    const clearTokens = () => {
        storage.removeItem(TOKEN_NAME_IN_STORAGE)
        storage.removeItem(REFRESH_TOKEN_NAME_IN_STORAGE)
    }

    return {
        setVerificationToken,
        verificationToken: storage.getItem(VERIFICATION_TOKEN_NAME_IN_STORAGE),
        setToken,
        token: storage.getItem(TOKEN_NAME_IN_STORAGE),
        setRefreshToken,
        refreshToken: storage.getItem(REFRESH_TOKEN_NAME_IN_STORAGE),
        clearTokens,
    }
}
