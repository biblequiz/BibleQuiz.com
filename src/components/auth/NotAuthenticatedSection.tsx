import { AuthManager, PopupType } from "../../types/AuthManager";

interface Props {
}

export default function NotAuthenticatedSection({ }: Props) {

    const authManager = AuthManager.useNanoStore();

    return (
        <div className="hero bg-base-300 rounded-2xl shadow-lg">
            <div className="hero-content text-center py-16 px-8">
                <div className="max-w-4xl">
                    <h1 className="text-3xl font-bold text-base-content mb-4">
                        Sign-in Required
                    </h1>
                    <p className="text-lg text-base-content/70 mb-8">
                        Some features of BibleQuiz.com require you to sign in with your BibleQuiz.com
                        account. If you've never signed up before, don't worry - it's free and easy to
                        do!
                    </p>
                    <button
                        className="btn btn-primary mt-0 mb-0"
                        disabled={authManager.popupType != PopupType.None}
                        onClick={() => {
                            authManager.login();
                        }}>
                        Sign In or Sign-Up
                    </button>
                    <p className="text-sm italic text-base-content/70 mt-2">
                        If you've previously signed in on registration.biblequiz.com, this is the same
                        account.
                    </p>
                </div>
            </div>
        </div>);
}