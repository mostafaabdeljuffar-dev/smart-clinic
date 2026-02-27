export type AppConfig = {
    apiPrefix: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    locale: string
    accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies'
    enableMock: boolean
    activeNavTranslation: boolean
}

const appConfig: AppConfig = {
    apiPrefix: '',
    authenticatedEntryPath: '/',
    unAuthenticatedEntryPath: '/',
    locale: 'en',
    accessTokenPersistStrategy: 'localStorage',
    enableMock: true,
    activeNavTranslation: true,
}

export default appConfig
