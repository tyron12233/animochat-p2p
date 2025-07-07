import Home from "../components/home";
import { useAuth } from "../context/auth-context"
import { AnimoChatProvider } from "../provider/animochat-provider";

export default function AuthenticatedPage() {
    const { user, session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <>Loading</>
        )
    }

    return (
        <>
            <AnimoChatProvider user={user}>
              <Home />
            </AnimoChatProvider>
        </>
    )
}