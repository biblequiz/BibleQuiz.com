import type { AuthManager } from "../AuthManager";
import type { Person } from "./PeopleService";
import { RemoteServiceModelBase, RemoteServiceUrlBase, RemoteServiceUtility } from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/Auth";

/**
 * Wrapper for the Auth service.
 */
export class AuthService {

    /**
     * Impersonates the identity id.
     * 
     * @param auth AuthManager to use for authentication.
     * @param id Id for the person to impersonate. If the value is null, it means impersonation should stop.
     */
    public static impersonate(
        auth: AuthManager,
        id: string | null): Promise<void> {

        return RemoteServiceUtility.executeHttpRequest(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Impersonate/${id ? id : ""}`);
    }

    /**
     * Signs the user up.
     * 
     * @param auth AuthManager to use for authentication.
     * @param info Info to use when signing the user up.
     */
    public static signUp(
        auth: AuthManager,
        info: UserSignUpInfo): Promise<void> {

        return RemoteServiceUtility.executeHttpRequest<void>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/SignUp`,
            null,
            info);
    }

    /**
     * Gets the current user's identities.
     *
     * @param auth AuthManager to use for authentication.
     */
    public static getIdentities(
        auth: AuthManager): Promise<UserIdentity[]> {

        return RemoteServiceUtility.executeHttpRequest<UserIdentity[]>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Identities`);
    }

    /**
     * Deletes an identity.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the identity.
     */
    public static deleteIdentity(
        auth: AuthManager,
        id: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequest<void>(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Identities/${id}`);
    }
}

/**
 * Data when signing up.
 */
export class UserSignUpInfo extends RemoteServiceModelBase<string> {

    /**
     * Gets or sets the person associated with the user.
     */
    Person!: Person;

    /**
     * Value indicating the user has agreed to the terms.
     */
    TermsAgree: boolean = false;

    /**
     * Captcha Response for the user.
     */
    CaptchaResponse!: string | null;
}

/**
 * Model for a user identity.
 */
export class UserIdentity extends RemoteServiceModelBase<string> {

    /**
     * Gets the e-mail address associated with this identity.
     */
    EmailAddress!: string;

    /**
     * Gets the identity type.
     */
    Type!: UserIdentityType;
}

/**
 * Type for a user identity.
 */
export enum UserIdentityType {

    /**
     * Facebook identity.
     */
    Facebook,

    /**
     * Google identity.
     */
    Google,

    /**
     * Internal identity using user name and password.
     */
    UserNamePassword,

    /**
     * Unified BibleQuiz.com users.
     */
    BibleQuizUsers,
}