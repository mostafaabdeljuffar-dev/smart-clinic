import { useSessionUser, useToken } from '@/store/authStore'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import AxiosBase from './AxiosBase'

const unauthorizedCode = [401, 419, 440]

const AxiosResponseIntrceptorErrorCallback = async (
    error: AxiosError & { config?: AxiosRequestConfig & { _retry?: boolean } }
) => {
    const { response, config } = error
    if (!config) return Promise.reject(error)

    const { refreshToken, setToken, clearTokens } = useToken()

    if (response && unauthorizedCode.includes(response.status)) {
        if (config._retry) return Promise.reject(error)
        config._retry = true

        if (!refreshToken) {
            clearTokens()
            useSessionUser.getState().setUser({})
            useSessionUser.getState().setSessionSignedIn(false)
            return Promise.reject(error)
        }

        try {
            const refreshResponse = await AxiosBase.post('/api/auth/refresh', { refreshToken })
            const newAccessToken = refreshResponse.data.accessToken
            setToken(newAccessToken)
            if (config.headers) config.headers['Authorization'] = `Bearer ${newAccessToken}`
            return AxiosBase(config)
        } catch (refreshError) {
            clearTokens()
            useSessionUser.getState().setUser({})
            useSessionUser.getState().setSessionSignedIn(false)
            return Promise.reject(refreshError)
        }
    }
    return Promise.reject(error)
}

export default AxiosResponseIntrceptorErrorCallback
