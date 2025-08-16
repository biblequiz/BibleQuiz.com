import { ParameterHelpers } from "../../utils/ParameterHelpers";

export abstract class ServiceBase<T> {

    private readonly baseUrl: string;
    private readonly authToken: string | null;

    constructor(baseServiceUrl: string, authToken: string | null) {
        this.baseUrl = `https://registration.biblequiz.com${baseServiceUrl}`;
        this.authToken = authToken;
    }

    /**
     * Gets a paginated result from the server.
     * 
     * @param successCallback Callback to execute if the request is successful.
     * @param errorCallback Callback to execute if the request encounters an error.
     * @param pageSize Size of the page to return.
     * @param pageNumber Page number for the result.
     * @param includeCount Indicates the count should be included in the response.
     * @param additionalUrlParameters Additional URL parameters to be included in the request.
     */
    protected getMany<TResult>(
        successCallback: (result: TResult) => void,
        errorCallback: HttpServiceErrorCallback,
        pageSize?: number,
        pageNumber?: number,
        includeCount?: boolean,
        additionalUrlParameters?: string): void {

        let urlSuffix: string = "";
        let hasParameters: boolean = false;
        if (null != pageSize) {
            urlSuffix += "?pgsz=" + pageSize;
            hasParameters = true;
        }

        if (null != pageNumber) {
            urlSuffix += (hasParameters ? "&pg=" : "?pg=") + pageNumber;
            hasParameters = true;
        }

        if (includeCount) {
            urlSuffix += (hasParameters ? "&count=true" : "?count=true");
            hasParameters = true;
        }

        if (null != additionalUrlParameters) {
            urlSuffix += (hasParameters ? "&" : "?") + additionalUrlParameters;
            hasParameters = true;
        }

        this.executeHttpRequest(successCallback, errorCallback, "GET", urlSuffix);
    }

    /**
     * Gets a single record.
     *
     * @param successCallback Callback to execute if the request is successful.
     * @param errorCallback Callback to execute if the request encounters an error.
     * @param id Id for the record.
     * @param additionalUrlParameters Additional URL parameters to be included in the request.
     */
    protected getSingle(
        successCallback: (result: T) => void,
        errorCallback: HttpServiceErrorCallback,
        id: string,
        additionalUrlParameters?: string): void {

        let urlSuffix = "/" + id;
        if (null != additionalUrlParameters) {
            urlSuffix += "?" + additionalUrlParameters;
        }

        this.executeHttpRequest(successCallback, errorCallback, "GET", urlSuffix);
    }

    /**
     * Executes an HTTP request.
     * 
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation fails.
     * @param method HTTP method.
     * @param urlSuffix URL Suffix.
     * @param data Data (if any) to submit.
     * @param isMultipartForm Value indicating whether this is a multipart form submission.
     */
    protected executeHttpRequest(
        successCallback: (result: any) => void,
        errorCallback: HttpServiceErrorCallback,
        method: string,
        urlSuffix: string,
        data?: string | any,
        isMultipartForm: boolean = false): void {

        const url = this.baseUrl + urlSuffix;
        let fetchOptions: RequestInit = {
            method,
            headers: {
                "Authorization": this.authToken ? `Bearer ${this.authToken}` : ""
            },
        };

        if (data != null) {
            if (isMultipartForm) {
                // Assume data is a FormData object
                fetchOptions.body = data;
                // Do not set Content-Type; browser will set it for FormData
            } else {
                fetchOptions.headers = {
                    "Content-Type": "application/json",
                };
                fetchOptions.body = JSON.stringify(data);
            }
        }

        fetch(url, fetchOptions)
            .then(async response => {
                let responseData: any;
                try {
                    responseData = await response.json();
                } catch {
                    responseData = null;
                }

                if (!response.ok) {

                    // Try to extract error details from the response
                    const errorDetails = responseData as ApiError;
                    let message = "An unknown error occurred.";
                    let mitigationCode: string | null = null;
                    if (errorDetails && errorDetails.Message) {
                        message = errorDetails.Message;
                        if (errorDetails.IsTransient) {
                            message += " Please try again as this may be a transient issue.";
                        }
                        if (errorDetails.Details) {
                            message += "<br />&nbsp;<br />" + errorDetails.Details;
                        } else if (errorDetails.ExceptionMessage) {
                            message += `<br />&nbsp;<br />[${ParameterHelpers.htmlEncode(errorDetails.ExceptionType)}] ` +
                                ParameterHelpers.htmlEncode(errorDetails.ExceptionMessage) + "<br />" +
                                ParameterHelpers.htmlEncode(errorDetails.StackTrace || "");
                        }
                        mitigationCode = errorDetails.MitigationCode;
                    }

                    return;
                }

                successCallback(responseData);
            })
            .catch(error => {
                // Network or parsing error
                errorCallback(0, error.message || "Network error", null);
            });
    }

    /**
     * Builds the URL parameters for a service call, including encoding values and excluding optional parameters.
     * 
     * @param parameters Parameters to include.
     * @param excludeNullValues Value indicating whether to exclude null values.
     * @param encodeValues Value indicating whether to encode parameter values.
     */
    protected buildUrlParameters(parameters: ServiceUrlParameters, excludeNullValues: boolean = true, encodeValues: boolean = true): string {

        let urlParameters: string[] = [];

        let keys: string[] = Object.keys(parameters);
        for (let key of keys) {
            let value: any = parameters[key];

            if (excludeNullValues && (null == value || (typeof value == "string" && 0 == (<string>value).length))) {
                continue;
            }
            else if (encodeValues) {
                value = ParameterHelpers.urlEncode(value);
            }

            urlParameters.push(key + "=" + value);
        }

        return urlParameters.join("&");
    }
}

/**
 * Callback for errors in a service request.
 */
export type HttpServiceErrorCallback = (statusCode: number, message: string, mitigationCode: string | null) => void;

/**
 * Parameters for a Service call's URL.
 */
export type ServiceUrlParameters = { [name: string]: any };

/**
 * Describes an error returned from the server.
 */
interface ApiError {

    /**
     * Message for the error.
     */
    Message: string | null;

    /**
     * Value indicating whether this is a transient error.
     */
    IsTransient: boolean;

    /**
     * Additional details about the error.
     */
    Details: string | null;

    /**
     * Code for the mitigation to this issue.
     */
    MitigationCode: string | null;

    /**
     * Message of the exception on the server.
     */
    ExceptionMessage: string | null;

    /**
     * Type of the exception on the server.
     */
    ExceptionType: string | null;

    /**
     * Stack Trace on the server.
     */
    StackTrace: string | null;
}

/**
 * Mitigation codes for Api Errors
 */
export class ApiMitigationCodes {

    /**
     * No special migitation.
     */
    public static readonly None: string = "";

    /**
     * Sign-up failed but a birthdate would help disambiguate.
     */
    public static readonly SignUpBirthdate: string = "SignUpBirthdate";

    /**
     * Sign-up failed because the account already exists and the password should be reset.
     */
    public static readonly SignUpResetPassword: string = "SignUpResetPassword";

    /**
     * Redirects to the sign-up page.
     */
    public static readonly RedirectToSignUp: string = "RedirectSignUp";

    /**
     * Requests a copy of the waiver.
     */
    public static readonly RequestWaiverCopy: string = "RequestWaiverCopy";

    /**
     * EZScore must fully reload the database due to backend configuration changes.
     */
    public static readonly FullyLoadDatabase: string = "FullyLoadDatabase";

    /**
     * EZScore cannot download or upload dates because the scoring dates are out-of-range.
     */
    public static readonly UpdateDatabaseDates: string = "UpdateScoringDatabaseDates";

    /**
     * EZScore cannot download because no meets are active.
     */
    public static readonly ActivateMeets: string = "ActivateMeets";
}

/**
 * Page returned from a call to a paginated API
 */
export interface ApiPage<T> {

    /**
     * Items on the page.
     */
    Items: T[];

    /**
     * Link (if any) to the next page.
     */
    NextPage: URL | null;

    /**
     * Total number of pages.
     */
    PageCount: number | null;
}

/**
 * Base interface for API models.
 */
export abstract class ApiModel<TId> {

    /**
     * ID for this model.
     */
    Id!: TId;
}