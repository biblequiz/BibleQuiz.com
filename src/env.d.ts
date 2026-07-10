/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_APPINSIGHTS_CONNECTION_STRING?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface Window {
    __bqGlobalTelemetryConfig?: {
        packageVersion: string;
        appInsightsConnectionString: string;
    };
}