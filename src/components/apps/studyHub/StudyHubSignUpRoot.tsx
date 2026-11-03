import { useEffect } from 'react';
import { AuthManager } from 'types/AuthManager';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import { StudyHubSignUp } from 'utils/StudyHubSignUp';

export default function StudyHubSignUpRoot() {

    useEffect(() => {
        const fallback = document.getElementById('study-hub-sign-up-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
    }, []);

    const returnUrl = StudyHubSignUp.getReturnUrlFromPage();

    return (
        <ProtectedRoute studyHub={{ returnUrl }}>
            <StudyHubReturn returnUrl={returnUrl} />
        </ProtectedRoute>
    );
}

/**
 * Shown to someone who already has a complete profile, including right after signing up.
 */
function StudyHubReturn({ returnUrl }: { returnUrl: string | null }) {

    const authManager = AuthManager.useNanoStore();

    useEffect(() => {
        if (returnUrl && authManager.userProfile) {
            window.location.replace(returnUrl);
        }
    }, [returnUrl]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your BibleQuiz.com account is ready</h2>
            {returnUrl
                ? (<p>Taking you back to Study Hub ... <a className="link" href={returnUrl}>Continue now</a></p>)
                : (<p>Go back to <a className="link" href="https://studyhub.biblequiz.com">Study Hub</a> and sign in.</p>)}
        </div>);
}
